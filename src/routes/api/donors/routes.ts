/**
 * Donors API Routes
 * Hono routes for donor portal
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { donorsApiService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional()
});

export const donorsRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))

  // GET /api/donors/profile - Get donor profile
  .get('/profile', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const contact = await donorsApiService.getProfile(userId);
      return c.json({ contact });
    } catch (error) {
      console.error('Error fetching donor profile:', error);

      if (error instanceof Error && error.message === 'Donor profile not found') {
        throw new HTTPException(404, { message: 'Donor profile not found' });
      }

      throw new HTTPException(500, { message: 'Failed to fetch donor profile' });
    }
  })

  // PUT /api/donors/profile - Update donor profile
  .put('/profile', zValidator('json', updateProfileSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const data = c.req.valid('json');

    try {
      const contact = await donorsApiService.updateProfile(userId, data);
      return c.json({ contact });
    } catch (error) {
      console.error('Error updating donor profile:', error);
      throw new HTTPException(500, { message: 'Failed to update donor profile' });
    }
  })

  // GET /api/donors/contributions/recent - Get recent contributions
  .get('/contributions/recent', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const limit = parseInt(c.req.query('limit') || '5');

    try {
      const contributions = await donorsApiService.getRecentContributions(userId, limit);
      return c.json({ contributions });
    } catch (error) {
      console.error('Error fetching recent contributions:', error);
      throw new HTTPException(500, { message: 'Failed to fetch recent contributions' });
    }
  })

  // GET /api/donors/contributions - Get all contributions
  .get('/contributions', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    try {
      const result = await donorsApiService.getAllContributions(userId, limit, offset);
      return c.json(result);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      throw new HTTPException(500, { message: 'Failed to fetch contributions' });
    }
  })

  // GET /api/donors/summary - Get donor summary
  .get('/summary', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const summary = await donorsApiService.getSummary(userId);
      return c.json({ summary });
    } catch (error) {
      console.error('Error fetching donor summary:', error);
      throw new HTTPException(500, { message: 'Failed to fetch donor summary' });
    }
  })

  // GET /api/donors/subscriptions - Get donor subscriptions
  .get('/subscriptions', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const status = c.req.query('status');

    try {
      const subscriptions = await donorsApiService.getSubscriptions(userId, status);
      return c.json({ subscriptions });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw new HTTPException(500, { message: 'Failed to fetch subscriptions' });
    }
  })

  // POST /api/donors/subscriptions/:id/cancel - Cancel subscription
  .post('/subscriptions/:id/cancel', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { id } = c.req.param();

    try {
      const subscription = await donorsApiService.cancelSubscription(userId, id);
      return c.json({ subscription });
    } catch (error) {
      console.error('Error canceling subscription:', error);

      if (error instanceof Error) {
        if (
          error.message === 'Subscription not found' ||
          error.message === 'Subscription is not active'
        ) {
          throw new HTTPException(400, { message: error.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to cancel subscription' });
    }
  });
