/**
 * Form Submission Processing Service
 * Handles the complete form submission flow
 */

import { db } from '$lib/server/db';
import {
  formSubmissions,
  donations,
  products,
  subscriptions,
  stripeTransactions
} from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { findOrCreateContact, type DonorInfo } from './contactMatchingService';
import { calculateFees } from '$lib/utils/feeCalculator';
import { getConfig } from './stripeConfigService';

export interface SubmissionData {
  formId: string;
  donorInfo: DonorInfo;
  paymentMethod: {
    paymentIntentId: string;
    paymentMethodId: string;
  };
  amount: number;
}

export interface SubmissionResult {
  submissionId: string;
  contactId: string;
  transactionId: string;
  linkedRecordId: string;
}

/**
 * Process a complete form submission
 */
export async function processFormSubmission(
  workspaceId: string,
  formType: 'donation' | 'product' | 'subscription',
  linkedItemId: string,
  data: SubmissionData
): Promise<SubmissionResult> {
  // 1. Find or create contact
  const contactId = await findOrCreateContact(workspaceId, data.donorInfo);

  // 2. Create form submission record
  const submission = await db
    .insert(formSubmissions)
    .values({
      formId: data.formId,
      contactId,
      workspaceId,
      amount: data.amount,
      submissionData: data.donorInfo as any,
      status: 'completed',
      stripePaymentIntentId: data.paymentMethod.paymentIntentId,
      submittedAt: new Date()
    })
    .returning();

  const submissionId = submission[0].id;

  // 3. Get workspace Stripe config for fee calculation
  const stripeConfig = await getConfig(workspaceId);
  const fees = calculateFees(data.amount, stripeConfig.platformFeePercentage);

  // 4. Create linked record based on form type
  let linkedRecordId: string;

  if (formType === 'donation') {
    const donation = await db
      .insert(donations)
      .values({
        contactId,
        workspaceId,
        amount: data.amount,
        status: 'completed',
        source: 'online',
        formId: data.formId,
        notes: 'Submitted via public form',
        createdAt: new Date()
      })
      .returning();

    linkedRecordId = donation[0].id;

    // Create transaction record
    await db.insert(stripeTransactions).values({
      workspaceId,
      contactId,
      formSubmissionId: submissionId,
      donationId: linkedRecordId,
      amount: data.amount,
      stripeFee: fees.stripeFee,
      platformFee: fees.platformFee,
      netAmount: fees.netAmount,
      stripePaymentIntentId: data.paymentMethod.paymentIntentId,
      type: 'donation',
      status: 'succeeded',
      createdAt: new Date()
    });
  } else if (formType === 'product') {
    // For products, we need to create a donation record with product link
    const donation = await db
      .insert(donations)
      .values({
        contactId,
        workspaceId,
        amount: data.amount,
        status: 'completed',
        source: 'online',
        productId: linkedItemId,
        formId: data.formId,
        notes: 'Product purchase via public form',
        createdAt: new Date()
      })
      .returning();

    linkedRecordId = donation[0].id;

    // Create transaction record
    await db.insert(stripeTransactions).values({
      workspaceId,
      contactId,
      formSubmissionId: submissionId,
      donationId: linkedRecordId,
      amount: data.amount,
      stripeFee: fees.stripeFee,
      platformFee: fees.platformFee,
      netAmount: fees.netAmount,
      stripePaymentIntentId: data.paymentMethod.paymentIntentId,
      type: 'product',
      status: 'succeeded',
      createdAt: new Date()
    });
  } else if (formType === 'subscription') {
    // For subscriptions, we create a subscription record
    // Note: This would need Stripe subscription creation in production
    const subscription = await db
      .insert(subscriptions)
      .values({
        contactId,
        workspaceId,
        amount: data.amount,
        frequency: 'monthly', // Default to monthly
        status: 'active',
        startDate: new Date(),
        stripeSubscriptionId: data.paymentMethod.paymentIntentId, // Placeholder
        formId: data.formId,
        createdAt: new Date()
      })
      .returning();

    linkedRecordId = subscription[0].id;

    // Create transaction record
    await db.insert(stripeTransactions).values({
      workspaceId,
      contactId,
      formSubmissionId: submissionId,
      subscriptionId: linkedRecordId,
      amount: data.amount,
      stripeFee: fees.stripeFee,
      platformFee: fees.platformFee,
      netAmount: fees.netAmount,
      stripePaymentIntentId: data.paymentMethod.paymentIntentId,
      type: 'subscription',
      status: 'succeeded',
      createdAt: new Date()
    });
  } else {
    throw new Error('Invalid form type');
  }

  // Get transaction ID
  const transactions = await db
    .select()
    .from(stripeTransactions)
    .where(eq(stripeTransactions.formSubmissionId, submissionId))
    .limit(1);

  return {
    submissionId,
    contactId,
    transactionId: transactions[0]?.id || '',
    linkedRecordId
  };
}
