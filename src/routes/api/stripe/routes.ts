/**
 * Stripe API Routes
 * Hono routes for Stripe integration
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { stripeApiService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

// Validation schemas
const createConfigSchema = z.object({
  workspaceId: z.string().uuid(),
  publishableKey: z.string().min(1),
  secretKey: z.string().min(1),
  webhookSecret: z.string().min(1),
  platformFeePercentage: z.number().min(0).max(100).optional()
});

const updateConfigSchema = z.object({
  publishableKey: z.string().min(1).optional(),
  secretKey: z.string().min(1).optional(),
  webhookSecret: z.string().min(1).optional(),
  platformFeePercentage: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional()
});

const createPaymentIntentSchema = z.object({
  workspaceId: z.string().uuid(),
  amount: z.number().positive(),
  metadata: z.record(z.any()).optional()
});

const createTransactionSchema = z.object({
  workspaceId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  formSubmissionId: z.string().uuid().optional(),
  donationId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().positive(),
  stripeFee: z.number(),
  platformFee: z.number(),
  netAmount: z.number(),
  stripePaymentIntentId: z.string(),
  stripeChargeId: z.string().optional(),
  type: z.enum(['donation', 'subscription', 'product']),
  metadata: z.record(z.any()).optional()
});

export const stripeRouter = new Hono()
  // Public routes (no JWT required)
  // GET /api/stripe/config/:workspaceId - Get publishable key
  .get('/config/:workspaceId', async (c) => {
    const { workspaceId } = c.req.param();

    try {
      const config = await stripeApiService.getConfig(workspaceId);
      // Only return publishable key for public access
      return c.json({ publishableKey: config.publishableKey });
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      throw new HTTPException(500, { message: 'Failed to fetch Stripe config' });
    }
  })

  // POST /api/stripe/payment-intent - Create payment intent (public)
  .post('/payment-intent', zValidator('json', createPaymentIntentSchema), async (c) => {
    const data = c.req.valid('json');

    try {
      const result = await stripeApiService.createPaymentIntent(
        data.workspaceId,
        data.amount,
        data.metadata || {}
      );
      return c.json(result);
    } catch (error) {
      console.error('Error creating payment intent:', error);

      if (error instanceof Error) {
        if (error.message === 'Stripe not configured for this workspace') {
          throw new HTTPException(400, { message: error.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to create payment intent' });
    }
  })

  // Protected routes (JWT required)
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))

  // GET /api/stripe/config?workspace_id=xxx
  .get('/config', async (c) => {
    const workspaceId = c.req.query('workspace_id');

    if (!workspaceId) {
      throw new HTTPException(400, { message: 'Workspace ID is required' });
    }

    try {
      const config = await stripeApiService.getConfig(workspaceId);
      return c.json({ config });
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      throw new HTTPException(500, { message: 'Failed to fetch Stripe config' });
    }
  })

  // POST /api/stripe/config
  .post('/config', zValidator('json', createConfigSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const data = c.req.valid('json');

    try {
      const config = await stripeApiService.createConfig(data);
      return c.json({ config }, 201);
    } catch (error) {
      console.error('Error creating Stripe config:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid Stripe API key') {
          throw new HTTPException(400, { message: error.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to create Stripe config' });
    }
  })

  // PUT /api/stripe/config?workspace_id=xxx
  .put('/config', zValidator('json', updateConfigSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const workspaceId = c.req.query('workspace_id');

    if (!workspaceId) {
      throw new HTTPException(400, { message: 'Workspace ID is required' });
    }

    const data = c.req.valid('json');

    try {
      const config = await stripeApiService.updateConfig(workspaceId, data);
      return c.json({ config });
    } catch (error) {
      console.error('Error updating Stripe config:', error);

      if (error instanceof Error) {
        if (error.message === 'Invalid Stripe API key') {
          throw new HTTPException(400, { message: error.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to update Stripe config' });
    }
  })

  // POST /api/stripe/config/test?workspace_id=xxx
  .post('/config/test', async (c) => {
    const workspaceId = c.req.query('workspace_id');

    if (!workspaceId) {
      throw new HTTPException(400, { message: 'Workspace ID is required' });
    }

    try {
      const result = await stripeApiService.testConnection(workspaceId);
      return c.json(result);
    } catch (error) {
      console.error('Error testing Stripe connection:', error);
      throw new HTTPException(500, { message: 'Failed to test Stripe connection' });
    }
  })

  // POST /api/stripe/transactions
  .post('/transactions', zValidator('json', createTransactionSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const data = c.req.valid('json');

    try {
      const transaction = await stripeApiService.createTransaction(data);
      return c.json({ transaction }, 201);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new HTTPException(500, { message: 'Failed to create transaction' });
    }
  })

  // GET /api/stripe/transactions?workspace_id=xxx
  .get('/transactions', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const workspaceId = c.req.query('workspace_id');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!workspaceId) {
      throw new HTTPException(400, { message: 'Workspace ID is required' });
    }

    try {
      const transactions = await stripeApiService.getTransactions(
        workspaceId,
        undefined,
        limit,
        offset
      );
      return c.json({ transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new HTTPException(500, { message: 'Failed to fetch transactions' });
    }
  })

  // GET /api/stripe/transactions/summary?workspace_id=xxx
  .get('/transactions/summary', async (c) => {
    const workspaceId = c.req.query('workspace_id');

    if (!workspaceId) {
      throw new HTTPException(400, { message: 'Workspace ID is required' });
    }

    try {
      const summary = await stripeApiService.getTransactionSummary(workspaceId);
      return c.json({ summary });
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      throw new HTTPException(500, { message: 'Failed to fetch transaction summary' });
    }
  });
