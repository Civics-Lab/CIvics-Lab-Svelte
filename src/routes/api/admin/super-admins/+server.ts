import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { isGlobalSuperAdmin } from '$lib/server/auth';
import { logSuperAdminAction } from '$lib/middleware/superadmin/audit';
import type { RequestHandler } from './$types';

// GET /api/admin/super-admins - Get all super admins
export const GET: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'Forbidden - Requires Super Admin privileges');
    }
    
    // Get all Super Admins
    const superAdmins = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        displayName: users.displayName
      })
      .from(users)
      .where(eq(users.isGlobalSuperAdmin, true));
    
    // Log the action
    await logSuperAdminAction({
      userId: user.id,
      action: 'LIST_SUPER_ADMINS',
      details: { count: superAdmins.length }
    });
    
    return json({ superAdmins });
  } catch (err) {
    console.error('Error fetching Super Admins:', err);
    
    // If the error is about the missing column, return a specific error
    if (err instanceof Error && 
        err.message && 
        err.message.includes('is_global_super_admin')) {
      return json({ 
        error: 'Database migration required for Super Admin functionality',
        needsMigration: true
      }, { status: 500 });
    }
    
    throw error(500, 'Internal server error');
  }
};

// POST /api/admin/super-admins - Add a new super admin
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'Forbidden - Requires Super Admin privileges');
    }
    
    const { userId } = await request.json();
    
    if (!userId) {
      throw error(400, 'User ID is required');
    }
    
    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!existingUser) {
      throw error(404, 'User not found');
    }
    
    // Update user to be a Super Admin
    await db
      .update(users)
      .set({ isGlobalSuperAdmin: true })
      .where(eq(users.id, userId));
    
    // Log the action
    await logSuperAdminAction({
      userId: user.id,
      action: 'ADD_SUPER_ADMIN',
      details: {
        targetUserId: userId,
        targetUsername: existingUser.username
      }
    });
    
    return json({ 
      success: true, 
      message: 'User has been given Super Admin privileges',
      user: existingUser
    });
  } catch (err) {
    console.error('Error adding Super Admin:', err);
    throw error(500, 'Internal server error');
  }
};
