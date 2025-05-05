import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { jwtUtils } from '$lib/utils/jwt';
import { isGlobalSuperAdmin } from '$lib/middleware/superadmin/access';
import { logSuperAdminAction } from '$lib/middleware/superadmin/audit';

// Remove Super Admin privileges
export async function DELETE({ params, request }) {
  try {
    const { userId } = params;
    
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = await jwtUtils.verifyToken(token);
    
    // Only Super Admins can manage other Super Admins
    const isSuperAdmin = await isGlobalSuperAdmin(payload.id);
    
    if (!isSuperAdmin) {
      return json({ error: 'Forbidden - Requires Super Admin privileges' }, { status: 403 });
    }
    
    // Can't remove your own Super Admin privileges
    if (userId === payload.id) {
      return json({ error: 'Cannot remove your own Super Admin privileges' }, { status: 400 });
    }
    
    // Check if user exists and is a Super Admin
    const [targetUser] = await db
      .select({ id: users.id, username: users.username, isGlobalSuperAdmin: users.isGlobalSuperAdmin })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!targetUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    if (!targetUser.isGlobalSuperAdmin) {
      return json({ error: 'User is not a Super Admin' }, { status: 400 });
    }
    
    // Remove Super Admin privileges
    await db
      .update(users)
      .set({ isGlobalSuperAdmin: false })
      .where(eq(users.id, userId));
    
    // Log the action
    await logSuperAdminAction({
      userId: payload.id,
      action: 'REMOVE_SUPER_ADMIN',
      details: {
        targetUserId: userId,
        targetUsername: targetUser.username
      }
    });
    
    return json({ 
      success: true, 
      message: 'Super Admin privileges have been removed',
      userId
    });
  } catch (error) {
    console.error('Error removing Super Admin privileges:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}