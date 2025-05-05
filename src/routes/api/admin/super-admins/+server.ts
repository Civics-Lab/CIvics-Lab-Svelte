import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { jwtUtils } from '$lib/utils/jwt';
import { isGlobalSuperAdmin } from '$lib/middleware/superadmin/access';
import { logSuperAdminAction } from '$lib/middleware/superadmin/audit';

// Get all super admins
export async function GET({ request }) {
  try {
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
      userId: payload.id,
      action: 'LIST_SUPER_ADMINS',
      details: { count: superAdmins.length }
    });
    
    return json({ superAdmins });
  } catch (error) {
    console.error('Error fetching Super Admins:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add a new super admin
export async function POST({ request }) {
  try {
    const { userId } = await request.json();
    
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
    
    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!existingUser) {
      return json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user to be a Super Admin
    await db
      .update(users)
      .set({ isGlobalSuperAdmin: true })
      .where(eq(users.id, userId));
    
    // Log the action
    await logSuperAdminAction({
      userId: payload.id,
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
  } catch (error) {
    console.error('Error adding Super Admin:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}