import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueCsvService } from './service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/actblue/csv?workspace_id=[workspace_id] - Get all CSV imports
export const GET: RequestHandler = async ({ url, locals }) => {
  const workspaceId = url.searchParams.get('workspace_id');

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  await verifyWorkspaceAccess(locals.user, workspaceId);

  try {
    const imports = await actblueCsvService.getImports(workspaceId);
    return json({ imports });
  } catch (err) {
    console.error('Error fetching CSV imports:', err);

    if (err instanceof Response) {
      throw err;
    }

    throw error(500, 'Failed to fetch CSV imports');
  }
};
