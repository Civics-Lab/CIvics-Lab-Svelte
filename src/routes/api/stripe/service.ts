/**
 * Stripe API Service
 * Business logic for Stripe API endpoints
 */

import * as stripeConfigService from '$lib/services/stripeConfigService';
import * as stripeTransactionService from '$lib/services/stripeTransactionService';
import * as stripeService from '$lib/services/stripeService';
import { calculateFees } from '$lib/utils/feeCalculator';
import type { CreateStripeConfigData, UpdateStripeConfigData } from '$lib/types/stripeConfig';
import type { CreateStripeTransactionData } from '$lib/types/stripeTransaction';

export const stripeApiService = {
  /**
   * Get Stripe config for workspace
   */
  async getConfig(workspaceId: string) {
    return await stripeConfigService.getPublicConfig(workspaceId);
  },

  /**
   * Create Stripe config
   */
  async createConfig(data: CreateStripeConfigData) {
    // Test the connection before saving
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(data.secretKey, {
      apiVersion: '2024-11-20.acacia'
    });

    // Verify the API key works
    try {
      await stripe.accounts.retrieve();
    } catch (error) {
      throw new Error('Invalid Stripe API key');
    }

    return await stripeConfigService.createConfig(data);
  },

  /**
   * Update Stripe config
   */
  async updateConfig(workspaceId: string, data: UpdateStripeConfigData) {
    // If updating secret key, test it first
    if (data.secretKey) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(data.secretKey, {
        apiVersion: '2024-11-20.acacia'
      });

      try {
        await stripe.accounts.retrieve();
      } catch (error) {
        throw new Error('Invalid Stripe API key');
      }
    }

    return await stripeConfigService.updateConfig(workspaceId, data);
  },

  /**
   * Test Stripe connection
   */
  async testConnection(workspaceId: string) {
    const result = await stripeConfigService.testConnection(workspaceId);
    return { success: result };
  },

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    workspaceId: string,
    amount: number,
    metadata: Record<string, any>
  ) {
    const config = await stripeConfigService.getConfig(workspaceId);

    if (!config || !config.isActive) {
      throw new Error('Stripe not configured for this workspace');
    }

    const stripe = stripeService.initializeStripe(config.secretKey);

    // Calculate fees
    const fees = calculateFees(amount, config.platformFeePercentage);

    const paymentIntent = await stripeService.createPaymentIntent(
      stripe,
      amount,
      {
        ...metadata,
        workspaceId,
        platformFee: fees.platformFee.toString(),
        stripeFee: fees.stripeFee.toString()
      }
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      fees
    };
  },

  /**
   * Create transaction record
   */
  async createTransaction(data: CreateStripeTransactionData) {
    return await stripeTransactionService.createTransaction(data);
  },

  /**
   * Get transactions for workspace
   */
  async getTransactions(workspaceId: string, filters?: any, limit?: number, offset?: number) {
    return await stripeTransactionService.getTransactionsByWorkspace(
      workspaceId,
      filters,
      limit,
      offset
    );
  },

  /**
   * Get all transactions (super admin only)
   */
  async getAllTransactions(filters?: any, limit?: number, offset?: number) {
    return await stripeTransactionService.getAllTransactions(filters, limit, offset);
  },

  /**
   * Get transaction summary
   */
  async getTransactionSummary(workspaceId: string, filters?: any) {
    return await stripeTransactionService.getTransactionSummary(workspaceId, filters);
  }
};
