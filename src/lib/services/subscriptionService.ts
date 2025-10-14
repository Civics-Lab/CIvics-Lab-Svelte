/**
 * Subscription Service
 * Handles business logic for recurring subscriptions
 */

import type {
  Subscription,
  CreateSubscriptionData,
  UpdateSubscriptionData,
  SubscriptionWithDetails,
  CancelSubscriptionData
} from '$lib/types/subscription';

/**
 * Fetch all subscriptions for a workspace
 */
export async function fetchSubscriptions(workspaceId: string, status?: string): Promise<Subscription[]> {
  try {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`/api/subscriptions?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch subscriptions');
    }

    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error('Error in fetchSubscriptions:', error);
    throw error;
  }
}

/**
 * Fetch subscriptions for a specific contact
 */
export async function fetchContactSubscriptions(contactId: string): Promise<Subscription[]> {
  try {
    const response = await fetch(`/api/contacts/${contactId}/subscriptions`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contact subscriptions');
    }

    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error('Error in fetchContactSubscriptions:', error);
    throw error;
  }
}

/**
 * Fetch a single subscription by ID
 */
export async function fetchSubscription(subscriptionId: string): Promise<Subscription> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error in fetchSubscription:', error);
    throw error;
  }
}

/**
 * Fetch subscription with full details (contact, product info)
 */
export async function fetchSubscriptionWithDetails(subscriptionId: string): Promise<SubscriptionWithDetails> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/details`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch subscription details');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error in fetchSubscriptionWithDetails:', error);
    throw error;
  }
}

/**
 * Fetch upcoming billing subscriptions
 */
export async function fetchUpcomingBilling(workspaceId: string, days: number = 7): Promise<SubscriptionWithDetails[]> {
  try {
    const response = await fetch(`/api/subscriptions/upcoming?workspace_id=${workspaceId}&days=${days}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch upcoming billing');
    }

    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error('Error in fetchUpcomingBilling:', error);
    throw error;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(subscriptionData: CreateSubscriptionData): Promise<Subscription> {
  try {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error in createSubscription:', error);
    throw error;
  }
}

/**
 * Update a subscription
 */
export async function updateSubscription(subscriptionId: string, updateData: UpdateSubscriptionData): Promise<Subscription> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error in updateSubscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelData?: CancelSubscriptionData): Promise<Subscription> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cancelData || {})
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    throw error;
  }
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(subscriptionId: string): Promise<Subscription> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/pause`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to pause subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error in pauseSubscription:', error);
    throw error;
  }
}

/**
 * Resume a paused subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Subscription> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}/resume`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resume subscription');
    }

    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error in resumeSubscription:', error);
    throw error;
  }
}

/**
 * Delete a subscription (hard delete)
 */
export async function deleteSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete subscription');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteSubscription:', error);
    throw error;
  }
}

/**
 * Calculate next billing date based on billing period
 */
export function calculateNextBillingDate(currentDate: Date, billingPeriod: string): Date {
  const nextDate = new Date(currentDate);

  switch (billingPeriod) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // one_time doesn't have next billing
      break;
  }

  return nextDate;
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'canceled': 'Canceled',
    'paused': 'Paused',
    'failed': 'Failed',
    'pending': 'Pending'
  };
  return statusMap[status] || status;
}

/**
 * Get status badge color for UI
 */
export function getStatusBadgeColor(status: string): string {
  const colorMap: Record<string, string> = {
    'active': 'green',
    'canceled': 'red',
    'paused': 'yellow',
    'failed': 'red',
    'pending': 'gray'
  };
  return colorMap[status] || 'gray';
}

/**
 * Check if subscription is expiring soon
 */
export function isExpiringSoon(subscription: Subscription, daysThreshold: number = 7): boolean {
  if (!subscription.nextBillingDate || subscription.status !== 'active') {
    return false;
  }

  const nextBilling = new Date(subscription.nextBillingDate);
  const today = new Date();
  const daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntilBilling <= daysThreshold && daysUntilBilling >= 0;
}

/**
 * Calculate total revenue from subscription
 */
export function calculateSubscriptionRevenue(subscription: Subscription): number {
  return subscription.amount * subscription.recurringCompleted;
}
