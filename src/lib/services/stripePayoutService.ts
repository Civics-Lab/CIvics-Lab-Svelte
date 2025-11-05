/**
 * Stripe Payout Service
 * Manages payouts to workspaces (super admin only)
 */

import { db } from '$lib/server/db';
import { stripePayouts, stripeTransactions } from '$lib/db/drizzle/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { StripePayout, CreateStripePayoutData, PayoutStatus } from '$lib/types/stripeTransaction';
import { updatePayoutStatus } from './stripeTransactionService';

/**
 * Create a new payout
 */
export async function createPayout(
  data: CreateStripePayoutData,
  createdById: string
): Promise<StripePayout> {
  // Get the transactions to calculate totals
  const transactions = await db
    .select()
    .from(stripeTransactions)
    .where(inArray(stripeTransactions.id, data.transactionIds));

  const totalGross = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalStripeFees = transactions.reduce((sum, t) => sum + t.stripeFee, 0);
  const totalPlatformFees = transactions.reduce((sum, t) => sum + t.platformFee, 0);
  const payoutAmount = totalGross - totalStripeFees - totalPlatformFees;

  // Create the payout record
  const result = await db
    .insert(stripePayouts)
    .values({
      workspaceId: data.workspaceId,
      payoutAmount,
      transactionIds: data.transactionIds,
      totalGross,
      totalStripeFees,
      totalPlatformFees,
      payoutMethod: data.payoutMethod,
      status: 'pending',
      notes: data.notes,
      createdById,
      createdAt: new Date()
    })
    .returning();

  // Mark transactions as processing
  for (const transactionId of data.transactionIds) {
    await updatePayoutStatus(transactionId, 'processing');
  }

  return result[0] as StripePayout;
}

/**
 * Get payout by ID
 */
export async function getPayout(id: string): Promise<StripePayout | null> {
  const result = await db
    .select()
    .from(stripePayouts)
    .where(eq(stripePayouts.id, id))
    .limit(1);

  return result.length > 0 ? (result[0] as StripePayout) : null;
}

/**
 * Get all payouts for a workspace
 */
export async function getPayoutsByWorkspace(
  workspaceId: string,
  limit: number = 100,
  offset: number = 0
): Promise<StripePayout[]> {
  const result = await db
    .select()
    .from(stripePayouts)
    .where(eq(stripePayouts.workspaceId, workspaceId))
    .orderBy(desc(stripePayouts.createdAt))
    .limit(limit)
    .offset(offset);

  return result as StripePayout[];
}

/**
 * Get all payouts (super admin only)
 */
export async function getAllPayouts(
  limit: number = 100,
  offset: number = 0
): Promise<StripePayout[]> {
  const result = await db
    .select()
    .from(stripePayouts)
    .orderBy(desc(stripePayouts.createdAt))
    .limit(limit)
    .offset(offset);

  return result as StripePayout[];
}

/**
 * Update payout status
 */
export async function updatePayoutStatusById(
  id: string,
  status: PayoutStatus
): Promise<StripePayout> {
  const updates: any = { status };

  if (status === 'paid') {
    updates.completedAt = new Date();
  }

  const result = await db
    .update(stripePayouts)
    .set(updates)
    .where(eq(stripePayouts.id, id))
    .returning();

  const payout = result[0] as StripePayout;

  // Update transaction statuses if payout is completed or failed
  if (status === 'paid') {
    for (const transactionId of payout.transactionIds as string[]) {
      await updatePayoutStatus(transactionId, 'paid', payout.completedAt);
    }
  } else if (status === 'failed') {
    for (const transactionId of payout.transactionIds as string[]) {
      await updatePayoutStatus(transactionId, 'failed');
    }
  }

  return payout;
}

/**
 * Complete a payout
 */
export async function completePayout(id: string): Promise<StripePayout> {
  return await updatePayoutStatusById(id, 'paid');
}

/**
 * Cancel a payout
 */
export async function cancelPayout(id: string): Promise<StripePayout> {
  const payout = await getPayout(id);

  if (!payout) {
    throw new Error('Payout not found');
  }

  // Reset transaction statuses to pending
  for (const transactionId of payout.transactionIds as string[]) {
    await updatePayoutStatus(transactionId, 'pending');
  }

  const result = await db
    .update(stripePayouts)
    .set({ status: 'failed' })
    .where(eq(stripePayouts.id, id))
    .returning();

  return result[0] as StripePayout;
}

/**
 * Get pending payouts
 */
export async function getPendingPayouts(): Promise<StripePayout[]> {
  const result = await db
    .select()
    .from(stripePayouts)
    .where(eq(stripePayouts.status, 'pending'))
    .orderBy(desc(stripePayouts.createdAt));

  return result as StripePayout[];
}

/**
 * Get payout statistics
 */
export async function getPayoutStatistics(workspaceId?: string) {
  let query = db.select().from(stripePayouts);

  if (workspaceId) {
    query = query.where(eq(stripePayouts.workspaceId, workspaceId));
  }

  const payouts = await query;

  const totalPayouts = payouts.length;
  const totalPaid = payouts
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.payoutAmount, 0);
  const totalPending = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.payoutAmount, 0);
  const totalProcessing = payouts
    .filter(p => p.status === 'processing')
    .reduce((sum, p) => sum + p.payoutAmount, 0);

  return {
    totalPayouts,
    totalPaid,
    totalPending,
    totalProcessing,
    averagePayout: totalPayouts > 0 ? Math.round(totalPaid / totalPayouts) : 0
  };
}
