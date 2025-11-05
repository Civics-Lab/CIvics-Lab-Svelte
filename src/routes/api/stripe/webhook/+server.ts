/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payment updates
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import Stripe from 'stripe';
import * as stripeConfigService from '$lib/services/stripeConfigService';
import * as stripeTransactionService from '$lib/services/stripeTransactionService';
import * as formSubmissionService from '$lib/services/formSubmissionService';
import * as donationService from '$lib/services/donationService';
import * as subscriptionService from '$lib/services/subscriptionService';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return json({ error: 'No signature provided' }, { status: 400 });
  }

  try {
    // Get workspace ID from the event metadata to retrieve the correct config
    // We'll need to parse the event first without verification to get the workspace ID
    const tempEvent = JSON.parse(body) as Stripe.Event;
    const workspaceId = tempEvent.data.object.metadata?.workspaceId;

    if (!workspaceId) {
      console.error('No workspace ID in webhook event metadata');
      return json({ error: 'No workspace ID provided' }, { status: 400 });
    }

    // Get the Stripe config for this workspace
    const config = await stripeConfigService.getConfig(workspaceId);

    if (!config) {
      console.error('No Stripe config found for workspace:', workspaceId);
      return json({ error: 'Workspace not configured' }, { status: 400 });
    }

    // Initialize Stripe with workspace config
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2024-11-20.acacia'
    });

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.webhookSecret
    );

    console.log('Webhook event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 400 }
    );
  }
};

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { formSubmissionId, donationId, subscriptionId } = paymentIntent.metadata;

  // Update transaction status
  const transaction = await stripeTransactionService.getTransactionByPaymentIntent(
    paymentIntent.id
  );

  if (transaction) {
    await stripeTransactionService.updateTransactionStatus(transaction.id, 'succeeded');
  }

  // Update form submission if exists
  if (formSubmissionId) {
    await formSubmissionService.updateSubmissionStatus(formSubmissionId, 'completed');
  }

  // Update donation if exists
  if (donationId) {
    await donationService.updateDonationStatus(donationId, 'cleared');
  }

  // Update subscription if exists
  if (subscriptionId) {
    await subscriptionService.updateSubscriptionStatus(subscriptionId, 'active');
  }

  // TODO: Send receipt email
  console.log('Payment succeeded for payment intent:', paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { formSubmissionId, subscriptionId } = paymentIntent.metadata;

  // Update transaction status
  const transaction = await stripeTransactionService.getTransactionByPaymentIntent(
    paymentIntent.id
  );

  if (transaction) {
    await stripeTransactionService.updateTransactionStatus(transaction.id, 'failed');
  }

  // Update form submission if exists
  if (formSubmissionId) {
    await formSubmissionService.updateSubmissionStatus(formSubmissionId, 'failed');
  }

  // Update subscription if exists
  if (subscriptionId) {
    await subscriptionService.updateSubscriptionStatus(subscriptionId, 'failed');
  }

  // TODO: Send payment failed notification
  console.log('Payment failed for payment intent:', paymentIntent.id);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  // Update transaction status
  const transaction = await stripeTransactionService.getTransactionByPaymentIntent(
    paymentIntentId
  );

  if (transaction) {
    await stripeTransactionService.updateTransactionStatus(transaction.id, 'refunded');

    // Update related donation if exists
    if (transaction.donationId) {
      // TODO: Update donation to refunded status
      console.log('Donation refunded:', transaction.donationId);
    }
  }

  // TODO: Send refund notification
  console.log('Charge refunded:', charge.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { subscriptionId } = subscription.metadata;

  if (!subscriptionId) {
    console.log('No subscription ID in metadata');
    return;
  }

  // Update subscription record
  await subscriptionService.updateSubscriptionFromStripe(subscriptionId, {
    status: subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'canceled' : 'paused',
    nextBillingDate: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : undefined
  });

  console.log('Subscription updated:', subscriptionId);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { subscriptionId } = subscription.metadata;

  if (!subscriptionId) {
    console.log('No subscription ID in metadata');
    return;
  }

  // Mark subscription as canceled
  await subscriptionService.updateSubscriptionStatus(subscriptionId, 'canceled');

  // TODO: Send cancellation confirmation
  console.log('Subscription deleted:', subscriptionId);
}
