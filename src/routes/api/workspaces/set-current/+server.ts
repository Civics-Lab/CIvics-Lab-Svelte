import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { workspaces } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';

// POST /api/workspaces/set-current - Set current workspace ID in cookies
export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const body = await request.json();
    const { workspaceId } = body;
    
    if (!workspaceId) {
      throw error(400, 'Workspace ID is required');
    }
    
    console.log(`Setting current workspace to ${workspaceId} for user ${locals.user.id}`);
    
    // Verify the workspace exists
    const workspace = await db.select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    
    if (!workspace.length) {
      throw error(404, 'Workspace not found');
    }
    
    // Set the workspace ID in a cookie - use a 30-day expiry
    cookies.set('current_workspace_id', workspaceId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax'
    });
    
    return json({ success: true });
  } catch (err) {
    console.error('Error setting current workspace:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to set workspace');
  }
};
