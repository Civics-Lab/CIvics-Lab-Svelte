import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueConfigService } from '../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// POST /api/actblue/config/webhook-url?workspace_id=[workspace_id] - Get webhook URL
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
    const { baseUrl } = await request.json();

    if (!baseUrl) {
      throw error(400, 'baseUrl is required');
    }

    // Basic URL validation
    try {
      new URL(baseUrl);
    } catch {
      throw error(400, 'Invalid baseUrl provided');
    }

    const webhookUrl = await actblueConfigService.getWebhookUrl(
      workspaceId,
      user.id,
      baseUrl
    );

    return json({ webhookUrl });
  } catch (err) {
    console.error('Error generating webhook URL:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && (err.message.includes('required') || err.message.includes('Invalid'))) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to generate webhook URL');
  }
};
