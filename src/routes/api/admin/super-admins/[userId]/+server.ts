import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { isGlobalSuperAdmin } from '$lib/server/auth';
import { logSuperAdminAction } from '$lib/middleware/superadmin/audit';
import type { RequestHandler } from './$types';

// DELETE /api/admin/super-admins/[userId] - Remove Super Admin privileges
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
  try {
    const { userId } = params;
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'Forbidden - Requires Super Admin privileges');
    }
    
    // Prevent removing your own Super Admin privileges
    if (userId === user.id) {
      throw error(400, 'Cannot remove your own Super Admin privileges');
    }
    
    // Check if user exists and is a Super Admin
    const [targetUser] = await db
      .select({ id: users.id, username: users.username, isGlobalSuperAdmin: users.isGlobalSuperAdmin })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!targetUser) {
      throw error(404, 'User not found');
    }
    
    if (!targetUser.isGlobalSuperAdmin) {
      throw error(400, 'User is not a Super Admin');
    }
    
    // Remove Super Admin privileges
    await db
      .update(users)
      .set({ isGlobalSuperAdmin: false })
      .where(eq(users.id, userId));
    
    // Log the action
    await logSuperAdminAction({
      userId: user.id,
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
  } catch (err) {
    console.error('Error removing Super Admin privileges:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Internal server error');
  }
};
