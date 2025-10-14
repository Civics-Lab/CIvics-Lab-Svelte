/**
 * Subscription type definitions
 */

import type { ProductBillingPeriod } from './product';

export type SubscriptionStatus = 'active' | 'canceled' | 'paused' | 'failed' | 'pending';

export interface Subscription {
  id: string;
  workspaceId: string;
  contactId: string;
  productId?: string;
  status: SubscriptionStatus;
  startDate?: string;
  nextBillingDate?: string;
  endDate?: string;
  canceledAt?: string;
  billingPeriod: ProductBillingPeriod;
  amount: number; // Amount in cents
  actblueOrderNumber?: string;
  recurringDuration?: number; // null/undefined means infinite
  recurringCompleted: number;
  weeklyRecurringSunset?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionData {
  workspaceId: string;
  contactId: string;
  productId?: string;
  status?: SubscriptionStatus;
  startDate?: string;
  nextBillingDate?: string;
  billingPeriod: ProductBillingPeriod;
  amount: number;
  actblueOrderNumber?: string;
  recurringDuration?: number;
  weeklyRecurringSunset?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionData {
  status?: SubscriptionStatus;
  nextBillingDate?: string;
  endDate?: string;
  canceledAt?: string;
  recurringCompleted?: number;
  metadata?: Record<string, any>;
}

export interface SubscriptionWithDetails extends Subscription {
  contactName?: string;
  contactEmail?: string;
  productName?: string;
  totalPaid: number;
  lastPaymentDate?: string;
  nextPaymentAmount: number;
}

export interface CancelSubscriptionData {
  reason?: string;
  canceledAt?: string;
}
