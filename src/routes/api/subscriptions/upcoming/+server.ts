import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscriptionService } from '../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/subscriptions/upcoming?workspace_id=[workspace_id]&days=[days] - Get upcoming billing subscriptions
export const GET: RequestHandler = async ({ url, locals }) => {
  const workspaceId = url.searchParams.get('workspace_id');
  const daysParam = url.searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : 7;

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  // Verify workspace access
  await verifyWorkspaceAccess(locals.user, workspaceId);

  try {
    const result = await subscriptionService.getUpcomingBilling(workspaceId, locals.user?.id || '', days);
    return json(result);
  } catch (err) {
    console.error('Error fetching upcoming billing:', err);

    if (err instanceof Response) {
      throw err;
    }

    throw error(500, 'Failed to fetch upcoming billing');
  }
};
