import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces } from '$lib/db/drizzle/schema';
import { jwtUtils } from '$lib/utils/jwt';
import { isGlobalSuperAdmin } from '$lib/middleware/superadmin/access';
import { logSuperAdminAction } from '$lib/middleware/superadmin/audit';

/**
 * Get all workspaces (only available to global Super Admins)
 */
export async function GET({ request }) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = await jwtUtils.verifyToken(token);
    
    // Check if user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(payload.id);
    
    if (!isSuperAdmin) {
      return json({ error: 'Forbidden - Requires Super Admin privileges' }, { status: 403 });
    }
    
    // Get all workspaces
    const allWorkspaces = await db.select().from(workspaces);
    
    // Log the action
    await logSuperAdminAction({
      userId: payload.id,
      action: 'LIST_ALL_WORKSPACES',
      details: { count: allWorkspaces.length }
    });
    
    return json({
      workspaces: allWorkspaces,
      count: allWorkspaces.length
    });
  } catch (error) {
    console.error('Error fetching all workspaces:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}