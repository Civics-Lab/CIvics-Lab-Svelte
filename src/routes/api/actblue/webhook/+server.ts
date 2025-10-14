/**
 * ActBlue Webhook Endpoint
 * Receives donation, refund, and cancellation events from ActBlue
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import {
  actblueWebhookLogs,
  actblueConfig,
  donations,
  subscriptions,
  products,
  workspaces
} from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { findMatchingContact, createContactFromActBlue } from '$lib/services/actblue/contactMatchingService';
import type {
  ActBlueDonationWebhook,
  ActBlueRefundWebhook,
  ActBlueCancellationWebhook
} from '$lib/types/actblue';
import bcrypt from 'bcryptjs';

/**
 * Validate Basic Auth credentials
 */
async function validateBasicAuth(
  request: Request,
  workspaceId: string
): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    // Decode Basic Auth
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Get ActBlue config for workspace
    const configResult = await db
      .select()
      .from(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId))
      .limit(1);

    if (configResult.length === 0) {
      console.error('No ActBlue config found for workspace');
      return false;
    }

    const config = configResult[0];

    // Validate username and password
    if (config.webhookUsername !== username) {
      console.error('Webhook username mismatch');
      return false;
    }

    if (!config.webhookPasswordHash) {
      console.error('No webhook password hash configured');
      return false;
    }

    const isValid = await bcrypt.compare(password, config.webhookPasswordHash);
    return isValid;
  } catch (err) {
    console.error('Error validating Basic Auth:', err);
    return false;
  }
}

/**
 * Log webhook event
 */
async function logWebhookEvent(
  workspaceId: string,
  eventType: 'donation' | 'refund' | 'cancellation',
  payload: any,
  status: 'success' | 'failed' | 'pending',
  errorMessage?: string
) {
  try {
    await db.insert(actblueWebhookLogs).values({
      workspaceId,
      eventType,
      actblueOrderNumber: payload.contribution?.orderNumber || null,
      payload,
      processedAt: status === 'success' ? new Date() : null,
      status,
      errorMessage: errorMessage || null,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('Error logging webhook:', err);
  }
}

/**
 * Process donation webhook
 */
async function processDonation(
  workspaceId: string,
  webhookData: ActBlueDonationWebhook,
  userId: string
): Promise<void> {
  try {
    const { donor, contribution, lineitems } = webhookData;

    // Match or create contact
    const matchResult = await findMatchingContact(donor, workspaceId);

    let contactId: string;
    if (matchResult.matched && matchResult.contactId) {
      contactId = matchResult.contactId;
      console.log(`Matched existing contact: ${contactId} (confidence: ${matchResult.confidence}%)`);
    } else {
      contactId = await createContactFromActBlue(donor, workspaceId, userId);
      console.log(`Created new contact: ${contactId}`);
    }

    // Process each line item (handles split donations)
    for (const lineitem of lineitems) {
      // Check if donation already exists (idempotency)
      const existingDonation = await db
        .select()
        .from(donations)
        .where(eq(donations.actblueLineitemId, lineitem.lineitemId.toString()))
        .limit(1);

      if (existingDonation.length > 0) {
        console.log(`Donation already exists for lineitem ${lineitem.lineitemId}, skipping`);
        continue;
      }

      // Determine if this is a recurring donation
      const isRecurring = contribution.recurringPeriod !== 'once';
      const recurringPeriod = contribution.recurringPeriod || 'once';

      let subscriptionId: string | null = null;

      // Handle recurring donations
      if (isRecurring) {
        // Check if subscription already exists for this order
        const existingSubscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.actblueOrderNumber, contribution.orderNumber))
          .limit(1);

        if (existingSubscription.length === 0 && lineitem.sequence === 0) {
          // Create new subscription for initial recurring donation
          const { v4: uuidv4 } = await import('uuid');
          subscriptionId = uuidv4();

          const recurringAmount = lineitem.recurringAmount
            ? Math.round(parseFloat(lineitem.recurringAmount) * 100)
            : Math.round(parseFloat(lineitem.amount) * 100);

          await db.insert(subscriptions).values({
            id: subscriptionId,
            workspaceId,
            contactId,
            status: 'active',
            startDate: new Date(contribution.createdAt),
            nextBillingDate: null, // ActBlue manages the schedule
            billingPeriod: recurringPeriod as any,
            amount: recurringAmount,
            actblueOrderNumber: contribution.orderNumber,
            recurringDuration: typeof contribution.recurringDuration === 'number'
              ? contribution.recurringDuration
              : null,
            recurringCompleted: 1,
            weeklyRecurringSunset: contribution.weeklyRecurringSunset
              ? new Date(contribution.weeklyRecurringSunset)
              : null,
            metadata: {
              actblueFormName: webhookData.form.name,
              refcodes: contribution.refcodes
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else if (existingSubscription.length > 0) {
          // Update existing subscription
          subscriptionId = existingSubscription[0].id;

          await db
            .update(subscriptions)
            .set({
              recurringCompleted: (existingSubscription[0].recurringCompleted || 0) + 1,
              updatedAt: new Date()
            })
            .where(eq(subscriptions.id, subscriptionId));
        }
      }

      // Create donation record
      const { v4: uuidv4 } = await import('uuid');
      const donationAmount = Math.round(parseFloat(lineitem.amount) * 100);

      await db.insert(donations).values({
        id: uuidv4(),
        contactId,
        amount: donationAmount,
        status: contribution.status === 'approved' ? 'donated' : 'processing',
        paymentType: contribution.isPaypal ? 'paypal' : 'card',
        notes: `ActBlue ${contribution.orderNumber} - ${webhookData.form.name}`,
        subscriptionId,
        isRecurring,
        recurringPeriod,
        recurrenceNumber: lineitem.sequence,
        actblueOrderNumber: contribution.orderNumber,
        actblueLineitemId: lineitem.lineitemId.toString(),
        actbluePaymentId: lineitem.paymentId || null,
        actblueData: webhookData,
        externalSource: 'actblue',
        disbursedAt: lineitem.paidAt ? new Date(lineitem.paidAt) : null,
        createdAt: new Date(contribution.createdAt),
        updatedAt: new Date()
      });

      console.log(`Created donation for lineitem ${lineitem.lineitemId}`);
    }
  } catch (err) {
    console.error('Error processing donation:', err);
    throw err;
  }
}

/**
 * Process refund webhook
 */
async function processRefund(
  workspaceId: string,
  webhookData: ActBlueRefundWebhook
): Promise<void> {
  try {
    const { lineitems } = webhookData;

    for (const lineitem of lineitems) {
      // Find the original donation
      const donationResult = await db
        .select()
        .from(donations)
        .where(eq(donations.actblueLineitemId, lineitem.lineitemId.toString()))
        .limit(1);

      if (donationResult.length === 0) {
        console.error(`Donation not found for refund lineitem ${lineitem.lineitemId}`);
        continue;
      }

      // Update donation to mark as refunded
      await db
        .update(donations)
        .set({
          status: 'promise', // or create a 'refunded' status
          refundedAt: new Date(lineitem.refundedAt),
          disbursedAt: lineitem.disbursedAt ? new Date(lineitem.disbursedAt) : null,
          recoveredAt: lineitem.recoveredAt ? new Date(lineitem.recoveredAt) : null,
          updatedAt: new Date()
        })
        .where(eq(donations.actblueLineitemId, lineitem.lineitemId.toString()));

      console.log(`Marked donation ${lineitem.lineitemId} as refunded`);
    }
  } catch (err) {
    console.error('Error processing refund:', err);
    throw err;
  }
}

/**
 * Process cancellation webhook
 */
async function processCancellation(
  workspaceId: string,
  webhookData: ActBlueCancellationWebhook
): Promise<void> {
  try {
    const { contribution } = webhookData;

    // Find the subscription by order number
    const subscriptionResult = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.actblueOrderNumber, contribution.orderNumber))
      .limit(1);

    if (subscriptionResult.length === 0) {
      console.error(`Subscription not found for order ${contribution.orderNumber}`);
      return;
    }

    // Update subscription to canceled
    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(contribution.cancelledAt),
        endDate: new Date(contribution.cancelledAt),
        recurringCompleted: contribution.recurCompleted || 0,
        metadata: {
          cancellationReason: contribution.cancellationReason,
          cancellationType: contribution.cancellationType,
          recurPledged: contribution.recurPledged
        },
        updatedAt: new Date()
      })
      .where(eq(subscriptions.actblueOrderNumber, contribution.orderNumber));

    console.log(`Canceled subscription for order ${contribution.orderNumber}`);
  } catch (err) {
    console.error('Error processing cancellation:', err);
    throw err;
  }
}

/**
 * POST /api/actblue/webhook - Receive ActBlue webhooks
 */
export const POST: RequestHandler = async ({ request, url }) => {
  try {
    // Get workspace ID from query parameter
    const workspaceId = url.searchParams.get('workspace_id');

    if (!workspaceId) {
      return json({ error: 'workspace_id is required' }, { status: 400 });
    }

    // Validate Basic Auth
    const isAuthorized = await validateBasicAuth(request, workspaceId);
    if (!isAuthorized) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse webhook payload
    const payload = await request.json();

    // Determine event type based on payload structure
    let eventType: 'donation' | 'refund' | 'cancellation';
    if (payload.contribution?.cancelledAt) {
      eventType = 'cancellation';
    } else if (payload.lineitems?.[0]?.refundedAt) {
      eventType = 'refund';
    } else {
      eventType = 'donation';
    }

    console.log(`Received ActBlue ${eventType} webhook for workspace ${workspaceId}`);

    // Log webhook immediately
    await logWebhookEvent(workspaceId, eventType, payload, 'pending');

    // Get a system user for creating records (use first workspace admin)
    const workspaceUsers = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (workspaceUsers.length === 0) {
      throw new Error('Workspace not found');
    }

    const systemUserId = workspaceUsers[0].createdById || 'system';

    // Process based on event type
    try {
      switch (eventType) {
        case 'donation':
          await processDonation(workspaceId, payload as ActBlueDonationWebhook, systemUserId);
          break;
        case 'refund':
          await processRefund(workspaceId, payload as ActBlueRefundWebhook);
          break;
        case 'cancellation':
          await processCancellation(workspaceId, payload as ActBlueCancellationWebhook);
          break;
      }

      // Update log to success
      await logWebhookEvent(workspaceId, eventType, payload, 'success');

      // Return 200 quickly (ActBlue requirement)
      return json({ success: true, message: `${eventType} processed successfully` });
    } catch (processingError) {
      // Log failure
      await logWebhookEvent(
        workspaceId,
        eventType,
        payload,
        'failed',
        processingError instanceof Error ? processingError.message : 'Unknown error'
      );

      // Still return 200 to prevent ActBlue from retrying
      // (we logged it for manual review)
      return json({
        success: false,
        message: 'Webhook received but processing failed',
        logged: true
      });
    }
  } catch (err) {
    console.error('Fatal error in webhook handler:', err);

    // Return 500 for auth/parsing errors so ActBlue will retry
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
