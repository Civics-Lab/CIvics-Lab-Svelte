/**
 * Stripe Transaction Service
 * Manages stripe transaction records in the database
 */

import { db } from '$lib/server/db';
import { stripeTransactions } from '$lib/db/drizzle/schema';
import { eq, and, desc, gte, lte, inArray } from 'drizzle-orm';
import type {
  StripeTransaction,
  CreateStripeTransactionData,
  TransactionFilters,
  TransactionSummary,
  TransactionStatus,
  PayoutStatus
} from '$lib/types/stripeTransaction';

/**
 * Create a new transaction record
 */
export async function createTransaction(
  data: CreateStripeTransactionData
): Promise<StripeTransaction> {
  const result = await db
    .insert(stripeTransactions)
    .values({
      ...data,
      status: 'pending',
      payoutStatus: 'pending',
      createdAt: new Date()
    })
    .returning();

  return result[0] as StripeTransaction;
}

/**
 * Get transaction by ID
 */
export async function getTransaction(id: string): Promise<StripeTransaction | null> {
  const result = await db
    .select()
    .from(stripeTransactions)
    .where(eq(stripeTransactions.id, id))
    .limit(1);

  return result.length > 0 ? (result[0] as StripeTransaction) : null;
}

/**
 * Get transaction by Stripe payment intent ID
 */
export async function getTransactionByPaymentIntent(
  paymentIntentId: string
): Promise<StripeTransaction | null> {
  const result = await db
    .select()
    .from(stripeTransactions)
    .where(eq(stripeTransactions.stripePaymentIntentId, paymentIntentId))
    .limit(1);

  return result.length > 0 ? (result[0] as StripeTransaction) : null;
}

/**
 * Get all transactions for a workspace with filters
 */
export async function getTransactionsByWorkspace(
  workspaceId: string,
  filters?: TransactionFilters,
  limit: number = 100,
  offset: number = 0
): Promise<StripeTransaction[]> {
  let query = db
    .select()
    .from(stripeTransactions)
    .where(eq(stripeTransactions.workspaceId, workspaceId));

  // Apply filters
  const conditions = [eq(stripeTransactions.workspaceId, workspaceId)];

  if (filters?.status) {
    conditions.push(eq(stripeTransactions.status, filters.status));
  }

  if (filters?.payoutStatus) {
    conditions.push(eq(stripeTransactions.payoutStatus, filters.payoutStatus));
  }

  if (filters?.type) {
    conditions.push(eq(stripeTransactions.type, filters.type));
  }

  if (filters?.dateFrom) {
    conditions.push(gte(stripeTransactions.createdAt, filters.dateFrom));
  }

  if (filters?.dateTo) {
    conditions.push(lte(stripeTransactions.createdAt, filters.dateTo));
  }

  const result = await db
    .select()
    .from(stripeTransactions)
    .where(and(...conditions))
    .orderBy(desc(stripeTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return result as StripeTransaction[];
}

/**
 * Get all transactions for a contact
 */
export async function getTransactionsByContact(
  contactId: string
): Promise<StripeTransaction[]> {
  const result = await db
    .select()
    .from(stripeTransactions)
    .where(eq(stripeTransactions.contactId, contactId))
    .orderBy(desc(stripeTransactions.createdAt));

  return result as StripeTransaction[];
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  id: string,
  status: TransactionStatus
): Promise<StripeTransaction> {
  const result = await db
    .update(stripeTransactions)
    .set({ status })
    .where(eq(stripeTransactions.id, id))
    .returning();

  return result[0] as StripeTransaction;
}

/**
 * Update transaction payout status
 */
export async function updatePayoutStatus(
  id: string,
  payoutStatus: PayoutStatus,
  payoutDate?: Date
): Promise<StripeTransaction> {
  const updates: any = { payoutStatus };

  if (payoutDate) {
    updates.payoutDate = payoutDate;
  }

  const result = await db
    .update(stripeTransactions)
    .set(updates)
    .where(eq(stripeTransactions.id, id))
    .returning();

  return result[0] as StripeTransaction;
}

/**
 * Mark transactions for payout
 */
export async function markForPayout(transactionIds: string[]): Promise<void> {
  await db
    .update(stripeTransactions)
    .set({ payoutStatus: 'processing' })
    .where(inArray(stripeTransactions.id, transactionIds));
}

/**
 * Get unpaid transactions for a workspace
 */
export async function getUnpaidTransactions(
  workspaceId: string
): Promise<StripeTransaction[]> {
  const result = await db
    .select()
    .from(stripeTransactions)
    .where(
      and(
        eq(stripeTransactions.workspaceId, workspaceId),
        eq(stripeTransactions.status, 'succeeded'),
        eq(stripeTransactions.payoutStatus, 'pending')
      )
    )
    .orderBy(desc(stripeTransactions.createdAt));

  return result as StripeTransaction[];
}

/**
 * Get all unpaid transactions (super admin)
 */
export async function getAllUnpaidTransactions(): Promise<StripeTransaction[]> {
  const result = await db
    .select()
    .from(stripeTransactions)
    .where(
      and(
        eq(stripeTransactions.status, 'succeeded'),
        eq(stripeTransactions.payoutStatus, 'pending')
      )
    )
    .orderBy(desc(stripeTransactions.createdAt));

  return result as StripeTransaction[];
}

/**
 * Get transaction summary for a workspace
 */
export async function getTransactionSummary(
  workspaceId: string,
  filters?: TransactionFilters
): Promise<TransactionSummary> {
  const transactions = await getTransactionsByWorkspace(workspaceId, filters, 10000);

  const totalGross = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalStripeFees = transactions.reduce((sum, t) => sum + t.stripeFee, 0);
  const totalPlatformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0);
  const totalNet = transactions.reduce((sum, t) => sum + t.netAmount, 0);
  const transactionCount = transactions.length;
  const averageTransaction = transactionCount > 0 ? totalGross / transactionCount : 0;

  return {
    totalGross,
    totalStripeFees,
    totalPlatformFees,
    totalNet,
    transactionCount,
    averageTransaction: Math.round(averageTransaction)
  };
}

/**
 * Get all transactions (super admin only)
 */
export async function getAllTransactions(
  filters?: TransactionFilters,
  limit: number = 100,
  offset: number = 0
): Promise<StripeTransaction[]> {
  const conditions = [];

  if (filters?.workspaceId) {
    conditions.push(eq(stripeTransactions.workspaceId, filters.workspaceId));
  }

  if (filters?.status) {
    conditions.push(eq(stripeTransactions.status, filters.status));
  }

  if (filters?.payoutStatus) {
    conditions.push(eq(stripeTransactions.payoutStatus, filters.payoutStatus));
  }

  if (filters?.type) {
    conditions.push(eq(stripeTransactions.type, filters.type));
  }

  if (filters?.dateFrom) {
    conditions.push(gte(stripeTransactions.createdAt, filters.dateFrom));
  }

  if (filters?.dateTo) {
    conditions.push(lte(stripeTransactions.createdAt, filters.dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select()
    .from(stripeTransactions)
    .where(whereClause)
    .orderBy(desc(stripeTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return result as StripeTransaction[];
}
