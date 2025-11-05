/**
 * Stripe Service
 * Handles all Stripe API interactions
 */

import Stripe from 'stripe';
import { calculateFees } from '$lib/utils/feeCalculator';
import type { StripeConfig } from '$lib/types/stripeConfig';

/**
 * Initialize Stripe instance with workspace config
 */
export function initializeStripe(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
    typescript: true
  });
}

/**
 * Create a payment intent for a form submission
 */
export async function createPaymentIntent(
  stripe: Stripe,
  amount: number,
  metadata: Record<string, any>
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    },
    metadata
  });
}

/**
 * Retrieve a payment intent by ID
 */
export async function retrievePaymentIntent(
  stripe: Stripe,
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  stripe: Stripe,
  email: string,
  name: string,
  metadata: Record<string, any>
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata
  });
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
  stripe: Stripe,
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  });
}

/**
 * Create a subscription for recurring donations
 */
export async function createSubscription(
  stripe: Stripe,
  customerId: string,
  priceId: string,
  metadata: Record<string, any>
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata
  });
}

/**
 * Create a price for a product
 */
export async function createPrice(
  stripe: Stripe,
  productId: string,
  amount: number,
  interval: 'month' | 'year' | 'week' | null
): Promise<Stripe.Price> {
  const priceData: Stripe.PriceCreateParams = {
    product: productId,
    currency: 'usd',
    unit_amount: amount
  };

  if (interval) {
    priceData.recurring = { interval };
  }

  return await stripe.prices.create(priceData);
}

/**
 * Create a product in Stripe
 */
export async function createProduct(
  stripe: Stripe,
  name: string,
  description?: string
): Promise<Stripe.Product> {
  return await stripe.products.create({
    name,
    description
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  stripe: Stripe,
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, params);
}

/**
 * Process a Stripe webhook event
 */
export async function processWebhookEvent(
  stripe: Stripe,
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Refund a payment
 */
export async function createRefund(
  stripe: Stripe,
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId
  };

  if (amount) {
    refundParams.amount = amount;
  }

  return await stripe.refunds.create(refundParams);
}

/**
 * Get balance transaction details (for fee information)
 */
export async function getBalanceTransaction(
  stripe: Stripe,
  balanceTransactionId: string
): Promise<Stripe.BalanceTransaction> {
  return await stripe.balanceTransactions.retrieve(balanceTransactionId);
}

/**
 * List recent charges for a workspace
 */
export async function listCharges(
  stripe: Stripe,
  limit: number = 100
): Promise<Stripe.ApiList<Stripe.Charge>> {
  return await stripe.charges.list({ limit });
}

/**
 * Retrieve charge details
 */
export async function retrieveCharge(
  stripe: Stripe,
  chargeId: string
): Promise<Stripe.Charge> {
  return await stripe.charges.retrieve(chargeId);
}
