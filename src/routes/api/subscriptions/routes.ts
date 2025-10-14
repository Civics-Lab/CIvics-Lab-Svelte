import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { subscriptionService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const createSubscriptionSchema = z.object({
  workspaceId: z.string().uuid(),
  contactId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  status: z.enum(['active', 'canceled', 'paused', 'failed', 'pending']).optional(),
  startDate: z.string().optional(),
  nextBillingDate: z.string().optional(),
  billingPeriod: z.enum(['one_time', 'weekly', 'monthly', 'yearly']),
  amount: z.number().positive(),
  actblueOrderNumber: z.string().optional(),
  recurringDuration: z.number().optional(),
  weeklyRecurringSunset: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const updateSubscriptionSchema = z.object({
  status: z.enum(['active', 'canceled', 'paused', 'failed', 'pending']).optional(),
  nextBillingDate: z.string().optional(),
  endDate: z.string().optional(),
  canceledAt: z.string().optional(),
  recurringCompleted: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

const cancelSubscriptionSchema = z.object({
  reason: z.string().optional()
});

const getSubscriptionsSchema = z.object({
  workspace_id: z.string().uuid(),
  status: z.enum(['active', 'canceled', 'paused', 'failed', 'pending']).optional()
});

const getUpcomingSchema = z.object({
  workspace_id: z.string().uuid(),
  days: z.string().transform(Number).optional()
});

export const subscriptionRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))

  // GET /api/subscriptions - Get all subscriptions for workspace
  .get('/', zValidator('query', getSubscriptionsSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { workspace_id, status } = c.req.valid('query');

    try {
      const result = await subscriptionService.getSubscriptions(workspace_id, userId, status);
      return c.json(result);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);

      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to fetch subscriptions' });
    }
  })

  // GET /api/subscriptions/upcoming - Get upcoming billing
  .get('/upcoming', zValidator('query', getUpcomingSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { workspace_id, days } = c.req.valid('query');

    try {
      const result = await subscriptionService.getUpcomingBilling(workspace_id, userId, days || 7);
      return c.json(result);
    } catch (err) {
      console.error('Error fetching upcoming billing:', err);

      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to fetch upcoming billing' });
    }
  })

  // POST /api/subscriptions - Create new subscription
  .post('/', zValidator('json', createSubscriptionSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const subscriptionData = c.req.valid('json');

    try {
      const subscription = await subscriptionService.createSubscription(subscriptionData, userId);
      return c.json({ subscription }, 201);
    } catch (err) {
      console.error('Error creating subscription:', err);

      if (err instanceof Error) {
        if (err.message === 'Missing required fields') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to create subscription' });
    }
  })

  // GET /api/subscriptions/:id - Get specific subscription
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const subscription = await subscriptionService.getSubscriptionById(id, userId);
      return c.json({ subscription });
    } catch (err) {
      console.error('Error fetching subscription:', err);

      if (err instanceof Error) {
        if (err.message === 'Subscription not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this subscription') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to fetch subscription' });
    }
  })

  // GET /api/subscriptions/:id/details - Get subscription with full details
  .get('/:id/details', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const subscription = await subscriptionService.getSubscriptionWithDetails(id, userId);
      return c.json({ subscription });
    } catch (err) {
      console.error('Error fetching subscription details:', err);

      if (err instanceof Error) {
        if (err.message === 'Subscription not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this subscription') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to fetch subscription details' });
    }
  })

  // PUT /api/subscriptions/:id - Update subscription
  .put('/:id', zValidator('json', updateSubscriptionSchema), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const updateData = c.req.valid('json');

    try {
      const subscription = await subscriptionService.updateSubscription(id, updateData, userId);
      return c.json({ subscription });
    } catch (err) {
      console.error('Error updating subscription:', err);

      if (err instanceof Error) {
        if (err.message === 'Subscription not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this subscription') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to update subscription' });
    }
  })

  // POST /api/subscriptions/:id/cancel - Cancel subscription
  .post('/:id/cancel', zValidator('json', cancelSubscriptionSchema), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { reason } = c.req.valid('json');

    try {
      const subscription = await subscriptionService.cancelSubscription(id, userId, reason);
      return c.json({ subscription, success: true });
    } catch (err) {
      console.error('Error canceling subscription:', err);

      if (err instanceof Error) {
        if (err.message === 'Subscription not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this subscription') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to cancel subscription' });
    }
  })

  // POST /api/subscriptions/:id/pause - Pause subscription
  .post('/:id/pause', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const subscription = await subscriptionService.pauseSubscription(id, userId);
      return c.json({ subscription, success: true });
    } catch (err) {
      console.error('Error pausing subscription:', err);

      if (err instanceof Error) {
        if (err.message === 'Subscription not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this subscription') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to pause subscription' });
    }
  })

  // POST /api/subscriptions/:id/resume - Resume subscription
  .post('/:id/resume', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const subscription = await subscriptionService.resumeSubscription(id, userId);
      return c.json({ subscription, success: true });
    } catch (err) {
      console.error('Error resuming subscription:', err);

      if (err instanceof Error) {
        if (err.message === 'Subscription not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this subscription') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to resume subscription' });
    }
  })

  // DELETE /api/subscriptions/:id - Delete subscription
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const result = await subscriptionService.deleteSubscription(id, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error deleting subscription:', err);

      if (err instanceof Error) {
        if (err.message === 'Subscription not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this subscription') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to delete subscription' });
    }
  });
