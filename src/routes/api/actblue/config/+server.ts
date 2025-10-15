import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueConfigService } from './service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/actblue/config?workspace_id=[workspace_id] - Get ActBlue configuration
export const GET: RequestHandler = async ({ url, locals }) => {
  const workspaceId = url.searchParams.get('workspace_id');

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  await verifyWorkspaceAccess(locals.user, workspaceId);

  try {
    const config = await actblueConfigService.getConfig(workspaceId, locals.user?.id || '');

    // Return null config if it doesn't exist yet (first-time setup)
    return json({ config });
  } catch (err) {
    console.error('Error fetching ActBlue config:', err);

    if (err instanceof Response) {
      throw err;
    }

    throw error(500, 'Failed to fetch ActBlue configuration');
  }
};

// POST /api/actblue/config?workspace_id=[workspace_id] - Create ActBlue configuration
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  try {
    const data = await request.json();

    if (!data.workspaceId) {
      throw error(400, 'workspaceId is required');
    }

    await verifyWorkspaceAccess(user, data.workspaceId);

    // Validate required fields
    if (!data.webhookUsername) {
      throw error(400, 'webhookUsername is required');
    }

    if (!data.webhookPassword || data.webhookPassword.length < 8) {
      throw error(400, 'webhookPassword must be at least 8 characters');
    }

    const config = await actblueConfigService.upsertConfig(
      data.workspaceId,
      user.id,
      data
    );

    return json({ config }, { status: 201 });
  } catch (err) {
    console.error('Error creating ActBlue config:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && (err.message.includes('required') || err.message.includes('Invalid'))) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to create ActBlue configuration');
  }
};

// PUT /api/actblue/config?workspace_id=[workspace_id] - Update ActBlue configuration
export const PUT: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  try {
    const data = await request.json();

    if (!data.workspaceId) {
      throw error(400, 'workspaceId is required');
    }

    await verifyWorkspaceAccess(user, data.workspaceId);

    // Validate password length if provided
    if (data.webhookPassword && data.webhookPassword.length < 8) {
      throw error(400, 'webhookPassword must be at least 8 characters');
    }

    const config = await actblueConfigService.upsertConfig(
      data.workspaceId,
      user.id,
      data
    );

    return json({ config });
  } catch (err) {
    console.error('Error updating ActBlue config:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && (err.message.includes('required') || err.message.includes('Invalid'))) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to update ActBlue configuration');
  }
};

// DELETE /api/actblue/config?workspace_id=[workspace_id] - Delete ActBlue configuration
export const DELETE: RequestHandler = async ({ url, locals }) => {
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
    await actblueConfigService.deleteConfig(workspaceId, user.id);
    return json({ success: true, message: 'ActBlue configuration deleted' });
  } catch (err) {
    console.error('Error deleting ActBlue config:', err);

    if (err instanceof Response) {
      throw err;
    }

    throw error(500, 'Failed to delete ActBlue configuration');
  }
};
