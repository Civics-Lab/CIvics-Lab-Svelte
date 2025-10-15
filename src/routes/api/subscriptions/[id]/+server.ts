import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscriptionService } from '../service';

// GET /api/subscriptions/:id - Get specific subscription
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Subscription ID is required');
  }

  try {
    const subscription = await subscriptionService.getSubscriptionById(id, user.id);
    return json({ subscription });
  } catch (err) {
    console.error('Error fetching subscription:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.message === 'Subscription not found') {
        throw error(404, err.message);
      }
      if (err.message.includes('access') || err.message.includes('permission')) {
        throw error(403, err.message);
      }
    }

    throw error(500, 'Failed to fetch subscription');
  }
};

// PUT /api/subscriptions/:id - Update subscription
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Subscription ID is required');
  }

  const updateData = await request.json();

  try {
    const subscription = await subscriptionService.updateSubscription(id, updateData, user.id);
    return json({ subscription });
  } catch (err) {
    console.error('Error updating subscription:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.message === 'Subscription not found') {
        throw error(404, err.message);
      }
      if (err.message.includes('access') || err.message.includes('permission')) {
        throw error(403, err.message);
      }
      if (err.message.includes('Invalid') || err.message.includes('required')) {
        throw error(400, err.message);
      }
    }

    throw error(500, 'Failed to update subscription');
  }
};

// DELETE /api/subscriptions/:id - Delete subscription
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Subscription ID is required');
  }

  try {
    const result = await subscriptionService.deleteSubscription(id, user.id);
    return json(result);
  } catch (err) {
    console.error('Error deleting subscription:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.message === 'Subscription not found') {
        throw error(404, err.message);
      }
      if (err.message.includes('access') || err.message.includes('permission')) {
        throw error(403, err.message);
      }
    }

    throw error(500, 'Failed to delete subscription');
  }
};
