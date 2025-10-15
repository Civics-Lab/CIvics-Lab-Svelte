import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscriptionService } from '../../service';

// POST /api/subscriptions/:id/cancel - Cancel a subscription
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Subscription ID is required');
  }

  const body = await request.json().catch(() => ({}));
  const cancelData = body.reason ? { reason: body.reason } : undefined;

  try {
    const subscription = await subscriptionService.cancelSubscription(id, user.id, cancelData);
    return json({ subscription });
  } catch (err) {
    console.error('Error canceling subscription:', err);

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

    throw error(500, 'Failed to cancel subscription');
  }
};
