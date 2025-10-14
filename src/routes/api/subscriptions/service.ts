import { db } from '$lib/server/db';
import { subscriptions, products, contacts, donations, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import { v4 as uuidv4 } from 'uuid';

export const subscriptionService = {
  async getSubscriptions(workspaceId: string, userId: string, status?: string) {
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    let query = db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId));

    if (status) {
      query = query.where(and(
        eq(subscriptions.workspaceId, workspaceId),
        eq(subscriptions.status, status as any)
      ));
    }

    return { subscriptions: await query.orderBy(desc(subscriptions.createdAt)) };
  },

  async getSubscriptionById(subscriptionId: string, userId: string) {
    return await this.checkSubscriptionAccess(userId, subscriptionId);
  },

  async getSubscriptionWithDetails(subscriptionId: string, userId: string) {
    const subscription = await this.checkSubscriptionAccess(userId, subscriptionId);

    // Get contact info
    const contact = await db.select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName })
      .from(contacts).where(eq(contacts.id, subscription.contactId)).limit(1);

    // Get product info
    const product = subscription.productId ? await db.select().from(products)
      .where(eq(products.id, subscription.productId)).limit(1) : [];

    // Get payment history
    const paymentHistory = await db.select().from(donations)
      .where(eq(donations.subscriptionId, subscriptionId)).orderBy(desc(donations.createdAt));

    return {
      ...subscription,
      contactName: contact[0] ? `${contact[0].firstName} ${contact[0].lastName}` : 'Unknown',
      contactEmail: null,
      productName: product[0]?.name || null,
      totalPaid: paymentHistory.reduce((sum, d) => sum + d.amount, 0),
      lastPaymentDate: paymentHistory[0]?.createdAt,
      nextPaymentAmount: subscription.amount
    };
  },

  async getUpcomingBilling(workspaceId: string, userId: string, days: number = 7) {
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const upcoming = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.workspaceId, workspaceId),
        eq(subscriptions.status, 'active'),
        gte(subscriptions.nextBillingDate, today),
        lte(subscriptions.nextBillingDate, futureDate)
      )).orderBy(subscriptions.nextBillingDate);

    return { subscriptions: upcoming };
  },

  async createSubscription(data: any, userId: string) {
    if (!data.workspaceId || !data.contactId || !data.billingPeriod || !data.amount) {
      throw new Error('Missing required fields');
    }

    const { hasAccess } = await verifyWorkspaceAccess(data.workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    const newSubscription = {
      id: uuidv4(),
      workspaceId: data.workspaceId,
      contactId: data.contactId,
      productId: data.productId || null,
      status: data.status || 'pending',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
      billingPeriod: data.billingPeriod,
      amount: Number(data.amount),
      actblueOrderNumber: data.actblueOrderNumber || null,
      recurringDuration: data.recurringDuration || null,
      recurringCompleted: 0,
      weeklyRecurringSunset: data.weeklyRecurringSunset ? new Date(data.weeklyRecurringSunset) : null,
      metadata: data.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [created] = await db.insert(subscriptions).values(newSubscription).returning();
    return created;
  },

  async updateSubscription(subscriptionId: string, data: any, userId: string) {
    await this.checkSubscriptionAccess(userId, subscriptionId);

    const updateFields: any = { updatedAt: new Date() };
    if (data.status) updateFields.status = data.status;
    if (data.nextBillingDate) updateFields.nextBillingDate = new Date(data.nextBillingDate);
    if (data.endDate) updateFields.endDate = new Date(data.endDate);
    if (data.canceledAt) updateFields.canceledAt = new Date(data.canceledAt);
    if (data.recurringCompleted !== undefined) updateFields.recurringCompleted = data.recurringCompleted;
    if (data.metadata) updateFields.metadata = data.metadata;

    const [updated] = await db.update(subscriptions).set(updateFields)
      .where(eq(subscriptions.id, subscriptionId)).returning();
    return updated;
  },

  async cancelSubscription(subscriptionId: string, userId: string, reason?: string) {
    await this.checkSubscriptionAccess(userId, subscriptionId);

    const [canceled] = await db.update(subscriptions).set({
      status: 'canceled',
      canceledAt: new Date(),
      endDate: new Date(),
      metadata: reason ? { cancellationReason: reason } : null,
      updatedAt: new Date()
    }).where(eq(subscriptions.id, subscriptionId)).returning();

    return canceled;
  },

  async pauseSubscription(subscriptionId: string, userId: string) {
    await this.checkSubscriptionAccess(userId, subscriptionId);
    const [paused] = await db.update(subscriptions).set({ status: 'paused', updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId)).returning();
    return paused;
  },

  async resumeSubscription(subscriptionId: string, userId: string) {
    await this.checkSubscriptionAccess(userId, subscriptionId);
    const [resumed] = await db.update(subscriptions).set({ status: 'active', updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId)).returning();
    return resumed;
  },

  async deleteSubscription(subscriptionId: string, userId: string) {
    await this.checkSubscriptionAccess(userId, subscriptionId);
    await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));
    return { success: true };
  },

  async checkSubscriptionAccess(userId: string, subscriptionId: string) {
    const result = await db.select().from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId)).limit(1);

    if (!result || result.length === 0) {
      throw new Error('Subscription not found');
    }

    const subscription = result[0];
    const userWorkspace = await db.select().from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, subscription.workspaceId)
      )).limit(1);

    if (!userWorkspace || userWorkspace.length === 0) {
      throw new Error('You do not have access to this subscription');
    }

    return subscription;
  }
};
