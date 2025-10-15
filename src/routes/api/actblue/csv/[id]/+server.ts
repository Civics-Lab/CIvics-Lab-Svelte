import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueCsvService } from '../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/actblue/csv/:id?workspace_id=[workspace_id] - Get specific CSV import
export const GET: RequestHandler = async ({ params, url, locals }) => {
  const { id } = params;
  const workspaceId = url.searchParams.get('workspace_id');

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  await verifyWorkspaceAccess(locals.user, workspaceId);

  try {
    const importRecord = await actblueCsvService.getImport(id, workspaceId);

    if (!importRecord) {
      throw error(404, 'Import not found');
    }

    return json({ import: importRecord });
  } catch (err) {
    console.error('Error fetching CSV import:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && err.message.includes('not found')) {
      throw error(404, err.message);
    }

    throw error(500, 'Failed to fetch CSV import');
  }
};
