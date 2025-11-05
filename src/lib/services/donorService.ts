/**
 * Donor Service
 * Manages donor portal operations
 */

import { db } from '$lib/server/db';
import {
  contacts,
  formSubmissions,
  donations,
  subscriptions,
  stripeTransactions,
  forms
} from '$lib/db/drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Get donor contact by user ID
 */
export async function getDonorContactByUserId(userId: string) {
  // Find contact linked to this user
  // This assumes we have a userId field on contacts or a user-contact mapping
  // For now, we'll use email matching
  const { users } = await import('$lib/db/drizzle/schema');

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || !user.email) {
    return null;
  }

  const [contact] = await db
    .select()
    .from(contacts)
    .where(sql`LOWER(${contacts.email}) = LOWER(${user.email})`)
    .limit(1);

  return contact || null;
}

/**
 * Get recent contributions for a donor
 */
export async function getRecentContributions(contactId: string, limit: number = 5) {
  const submissions = await db
    .select({
      id: formSubmissions.id,
      amount: formSubmissions.amount,
      status: formSubmissions.status,
      createdAt: formSubmissions.submittedAt,
      formId: formSubmissions.formId,
      formName: forms.name,
      formSlug: forms.slug,
      type: sql<string>`CASE
        WHEN ${donations.productId} IS NOT NULL THEN 'product'
        WHEN ${donations.subscriptionId} IS NOT NULL THEN 'subscription'
        ELSE 'donation'
      END`
    })
    .from(formSubmissions)
    .leftJoin(forms, eq(formSubmissions.formId, forms.id))
    .leftJoin(donations, eq(formSubmissions.id, donations.formSubmissionId))
    .where(and(eq(formSubmissions.contactId, contactId), eq(formSubmissions.status, 'completed')))
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(limit);

  return submissions;
}

/**
 * Get all contributions for a donor
 */
export async function getAllContributions(
  contactId: string,
  limit: number = 50,
  offset: number = 0
) {
  const submissions = await db
    .select({
      id: formSubmissions.id,
      amount: formSubmissions.amount,
      status: formSubmissions.status,
      createdAt: formSubmissions.submittedAt,
      formId: formSubmissions.formId,
      formName: forms.name,
      formSlug: forms.slug,
      type: sql<string>`CASE
        WHEN ${donations.productId} IS NOT NULL THEN 'product'
        WHEN ${donations.subscriptionId} IS NOT NULL THEN 'subscription'
        ELSE 'donation'
      END`
    })
    .from(formSubmissions)
    .leftJoin(forms, eq(formSubmissions.formId, forms.id))
    .leftJoin(donations, eq(formSubmissions.id, donations.formSubmissionId))
    .where(eq(formSubmissions.contactId, contactId))
    .orderBy(desc(formSubmissions.submittedAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(formSubmissions)
    .where(eq(formSubmissions.contactId, contactId));

  return {
    contributions: submissions,
    total: count
  };
}

/**
 * Get donor summary statistics
 */
export async function getDonorSummary(contactId: string) {
  const completedSubmissions = await db
    .select()
    .from(formSubmissions)
    .where(and(eq(formSubmissions.contactId, contactId), eq(formSubmissions.status, 'completed')));

  const totalContributed = completedSubmissions.reduce((sum, s) => sum + s.amount, 0);

  const activeSubscriptionsList = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.contactId, contactId), eq(subscriptions.status, 'active')));

  const monthlyRecurring = activeSubscriptionsList.reduce((sum, s) => sum + s.amount, 0);

  return {
    totalContributed,
    contributionCount: completedSubmissions.length,
    activeSubscriptionCount: activeSubscriptionsList.length,
    monthlyRecurring
  };
}

/**
 * Get donor subscriptions
 */
export async function getDonorSubscriptions(contactId: string, status?: string) {
  const conditions = [eq(subscriptions.contactId, contactId)];

  if (status) {
    conditions.push(eq(subscriptions.status, status as any));
  }

  const result = await db
    .select({
      id: subscriptions.id,
      amount: subscriptions.amount,
      frequency: subscriptions.frequency,
      status: subscriptions.status,
      startDate: subscriptions.startDate,
      endDate: subscriptions.endDate,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      formId: subscriptions.formId,
      formName: forms.name,
      formSlug: forms.slug
    })
    .from(subscriptions)
    .leftJoin(forms, eq(subscriptions.formId, forms.id))
    .where(and(...conditions))
    .orderBy(desc(subscriptions.startDate));

  return result;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, contactId: string) {
  // Verify subscription belongs to contact
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.contactId, contactId)))
    .limit(1);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (subscription.status !== 'active') {
    throw new Error('Subscription is not active');
  }

  // Cancel in Stripe if we have a Stripe subscription ID
  if (subscription.stripeSubscriptionId) {
    const { cancelSubscription: cancelStripeSubscription } = await import('./stripeService');
    const { getConfig } = await import('./stripeConfigService');
    const Stripe = (await import('stripe')).default;

    const config = await getConfig(subscription.workspaceId);
    const stripe = new Stripe(config.secretKey, { apiVersion: '2024-11-20.acacia' });
    await cancelStripeSubscription(stripe, subscription.stripeSubscriptionId);
  }

  // Update subscription status
  const [updated] = await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      endDate: new Date()
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();

  return updated;
}

/**
 * Update donor profile
 */
export async function updateDonorProfile(contactId: string, data: any) {
  const [updated] = await db
    .update(contacts)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(contacts.id, contactId))
    .returning();

  return updated;
}
