import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscriptionService } from './service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/subscriptions?workspace_id=[workspace_id]&status=[status] - Get all subscriptions for a workspace
export const GET: RequestHandler = async ({ url, locals }) => {
  const workspaceId = url.searchParams.get('workspace_id');
  const status = url.searchParams.get('status') || undefined;

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  // Verify workspace access
  await verifyWorkspaceAccess(locals.user, workspaceId);

  try {
    const result = await subscriptionService.getSubscriptions(workspaceId, locals.user?.id || '', status);
    return json(result);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);

    if (err instanceof Response) {
      throw err;
    }

    throw error(500, 'Failed to fetch subscriptions');
  }
};

// POST /api/subscriptions - Create a new subscription
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const subscriptionData = await request.json();

  if (!subscriptionData.workspaceId) {
    throw error(400, 'workspaceId is required');
  }

  // Verify workspace access
  await verifyWorkspaceAccess(user, subscriptionData.workspaceId);

  try {
    const subscription = await subscriptionService.createSubscription(subscriptionData, user.id);
    return json({ subscription }, { status: 201 });
  } catch (err) {
    console.error('Error creating subscription:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.message.includes('required') || err.message.includes('Invalid')) {
        throw error(400, err.message);
      }
    }

    throw error(500, 'Failed to create subscription');
  }
};
