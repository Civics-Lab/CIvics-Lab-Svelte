import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueCsvService } from '../../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/actblue/csv/status/:csvId?workspace_id=[workspace_id] - Check CSV export status
export const GET: RequestHandler = async ({ params, url, locals }) => {
  const { csvId } = params;
  const workspaceId = url.searchParams.get('workspace_id');

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  await verifyWorkspaceAccess(locals.user, workspaceId);

  try {
    const status = await actblueCsvService.checkCsvStatus(workspaceId, csvId);
    return json({ status });
  } catch (err) {
    console.error('Error checking CSV status:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && err.message.includes('not configured')) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to check CSV status');
  }
};
