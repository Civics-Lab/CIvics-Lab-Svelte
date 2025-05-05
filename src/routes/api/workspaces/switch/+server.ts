import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { jwtUtils } from '$lib/utils/jwt';
import { isGlobalSuperAdmin } from '$lib/middleware/superadmin/access';
import { logSuperAdminAction } from '$lib/middleware/superadmin/audit';

/**
 * Switch to a different workspace (only for global Super Admins)
 */
export async function POST({ request }) {
  try {
    const { workspaceId } = await request.json();
    
    if (!workspaceId) {
      return json({ error: 'Missing workspaceId' }, { status: 400 });
    }
    
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = await jwtUtils.verifyToken(token);
    
    // Verify user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(payload.id);
    
    if (!isSuperAdmin) {
      return json({ error: 'Forbidden - Requires Super Admin privileges' }, { status: 403 });
    }
    
    // Verify the workspace exists
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
    
    if (!workspace) {
      return json({ error: 'Workspace not found' }, { status: 404 });
    }
    
    // Log the action
    await logSuperAdminAction({
      userId: payload.id,
      action: 'SWITCH_WORKSPACE',
      workspaceId,
      details: { 
        workspaceName: workspace.name,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    });
    
    return json({ 
      success: true, 
      workspace,
      message: 'Super Admin successfully switched to workspace',
      switchedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error switching workspace:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}