import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueConfigService } from '../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// POST /api/actblue/config/test?workspace_id=[workspace_id] - Test webhook credentials
export const POST: RequestHandler = async ({ request, url, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const workspaceId = url.searchParams.get('workspace_id');

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  await verifyWorkspaceAccess(user, workspaceId);

  try {
    const { password } = await request.json();

    if (!password) {
      throw error(400, 'password is required');
    }

    const result = await actblueConfigService.testWebhookCredentials(
      workspaceId,
      user.id,
      password
    );

    return json(result);
  } catch (err) {
    console.error('Error testing credentials:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && (err.message.includes('required') || err.message.includes('Invalid'))) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to test credentials');
  }
};
