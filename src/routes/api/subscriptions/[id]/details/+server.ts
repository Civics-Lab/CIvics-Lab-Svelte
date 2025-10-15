import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscriptionService } from '../../service';

// GET /api/subscriptions/:id/details - Get subscription with full details
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
    const subscription = await subscriptionService.getSubscriptionWithDetails(id, user.id);
    return json({ subscription });
  } catch (err) {
    console.error('Error fetching subscription details:', err);

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

    throw error(500, 'Failed to fetch subscription details');
  }
};
