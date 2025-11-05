/**
 * Donors API Service
 * Business logic for donor portal API endpoints
 */

import * as donorService from '$lib/services/donorService';

export const donorsApiService = {
  /**
   * Get donor profile (contact info)
   */
  async getProfile(userId: string) {
    const contact = await donorService.getDonorContactByUserId(userId);

    if (!contact) {
      throw new Error('Donor profile not found');
    }

    return contact;
  },

  /**
   * Update donor profile
   */
  async updateProfile(userId: string, data: any) {
    const contact = await donorService.getDonorContactByUserId(userId);

    if (!contact) {
      throw new Error('Donor profile not found');
    }

    return await donorService.updateDonorProfile(contact.id, data);
  },

  /**
   * Get recent contributions
   */
  async getRecentContributions(userId: string, limit: number = 5) {
    const contact = await donorService.getDonorContactByUserId(userId);

    if (!contact) {
      return [];
    }

    return await donorService.getRecentContributions(contact.id, limit);
  },

  /**
   * Get all contributions
   */
  async getAllContributions(userId: string, limit: number = 50, offset: number = 0) {
    const contact = await donorService.getDonorContactByUserId(userId);

    if (!contact) {
      return { contributions: [], total: 0 };
    }

    return await donorService.getAllContributions(contact.id, limit, offset);
  },

  /**
   * Get donor summary
   */
  async getSummary(userId: string) {
    const contact = await donorService.getDonorContactByUserId(userId);

    if (!contact) {
      return {
        totalContributed: 0,
        contributionCount: 0,
        activeSubscriptionCount: 0,
        monthlyRecurring: 0
      };
    }

    return await donorService.getDonorSummary(contact.id);
  },

  /**
   * Get donor subscriptions
   */
  async getSubscriptions(userId: string, status?: string) {
    const contact = await donorService.getDonorContactByUserId(userId);

    if (!contact) {
      return [];
    }

    return await donorService.getDonorSubscriptions(contact.id, status);
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, subscriptionId: string) {
    const contact = await donorService.getDonorContactByUserId(userId);

    if (!contact) {
      throw new Error('Donor profile not found');
    }

    return await donorService.cancelSubscription(subscriptionId, contact.id);
  }
};
