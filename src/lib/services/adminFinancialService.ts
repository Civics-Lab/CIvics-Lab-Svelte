/**
 * Admin Financial Service
 * Super admin financial dashboard operations
 */

import { db } from '$lib/server/db';
import { stripeTransactions, workspaces, contacts } from '$lib/db/drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

/**
 * Get financial overview for all workspaces
 */
export async function getFinancialOverview() {
  // Get total processed amount
  const [totals] = await db
    .select({
      totalProcessed: sql<number>`COALESCE(SUM(${stripeTransactions.amount}), 0)::int`,
      totalPlatformFees: sql<number>`COALESCE(SUM(${stripeTransactions.platformFee}), 0)::int`,
      totalStripeFees: sql<number>`COALESCE(SUM(${stripeTransactions.stripeFee}), 0)::int`,
      transactionCount: sql<number>`COUNT(*)::int`
    })
    .from(stripeTransactions)
    .where(eq(stripeTransactions.status, 'succeeded'));

  // Get count of active workspaces (workspaces with transactions)
  const [workspaceCount] = await db
    .select({
      count: sql<number>`COUNT(DISTINCT ${stripeTransactions.workspaceId})::int`
    })
    .from(stripeTransactions);

  return {
    totalProcessed: totals.totalProcessed || 0,
    totalPlatformFees: totals.totalPlatformFees || 0,
    totalStripeFees: totals.totalStripeFees || 0,
    transactionCount: totals.transactionCount || 0,
    activeWorkspaces: workspaceCount.count || 0
  };
}

/**
 * Get all transactions with filtering
 */
export async function getAllTransactions(
  filters: {
    workspaceId?: string;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const {
    workspaceId,
    status,
    type,
    limit = 50,
    offset = 0
  } = filters;

  // Build where conditions
  const conditions = [];
  if (workspaceId) {
    conditions.push(eq(stripeTransactions.workspaceId, workspaceId));
  }
  if (status) {
    conditions.push(eq(stripeTransactions.status, status as any));
  }
  if (type) {
    conditions.push(eq(stripeTransactions.type, type as any));
  }

  // Get transactions with workspace and contact names
  const transactions = await db
    .select({
      id: stripeTransactions.id,
      workspaceId: stripeTransactions.workspaceId,
      workspaceName: workspaces.name,
      contactId: stripeTransactions.contactId,
      contactName: sql<string>`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
      amount: stripeTransactions.amount,
      stripeFee: stripeTransactions.stripeFee,
      platformFee: stripeTransactions.platformFee,
      netAmount: stripeTransactions.netAmount,
      type: stripeTransactions.type,
      status: stripeTransactions.status,
      stripePaymentIntentId: stripeTransactions.stripePaymentIntentId,
      createdAt: stripeTransactions.createdAt
    })
    .from(stripeTransactions)
    .leftJoin(workspaces, eq(stripeTransactions.workspaceId, workspaces.id))
    .leftJoin(contacts, eq(stripeTransactions.contactId, contacts.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(stripeTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(stripeTransactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    transactions,
    total: count
  };
}

/**
 * Get transaction summary by workspace
 */
export async function getTransactionSummaryByWorkspace() {
  const results = await db
    .select({
      workspaceId: stripeTransactions.workspaceId,
      workspaceName: workspaces.name,
      totalProcessed: sql<number>`COALESCE(SUM(${stripeTransactions.amount}), 0)::int`,
      totalPlatformFees: sql<number>`COALESCE(SUM(${stripeTransactions.platformFee}), 0)::int`,
      totalStripeFees: sql<number>`COALESCE(SUM(${stripeTransactions.stripeFee}), 0)::int`,
      netAmount: sql<number>`COALESCE(SUM(${stripeTransactions.netAmount}), 0)::int`,
      transactionCount: sql<number>`COUNT(*)::int`
    })
    .from(stripeTransactions)
    .leftJoin(workspaces, eq(stripeTransactions.workspaceId, workspaces.id))
    .where(eq(stripeTransactions.status, 'succeeded'))
    .groupBy(stripeTransactions.workspaceId, workspaces.name)
    .orderBy(desc(sql`SUM(${stripeTransactions.amount})`));

  return results;
}
