import { db } from '$lib/server/db';
import { users, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user is a global Super Admin
 */
export async function isGlobalSuperAdmin(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ isGlobalSuperAdmin: users.isGlobalSuperAdmin })
    .from(users)
    .where(eq(users.id, userId));
  
  return user?.isGlobalSuperAdmin || false;
}

/**
 * Check if a user has access to a workspace (either as a member or as a global Super Admin)
 */
export async function hasWorkspaceAccess(userId: string, workspaceId: string): Promise<{ 
  hasAccess: boolean;
  accessType: 'none' | 'member' | 'global_super_admin'; 
  role: string | null;
}> {
  // First check if user is a global Super Admin
  const isSuperAdmin = await isGlobalSuperAdmin(userId);
  
  if (isSuperAdmin) {
    return { 
      hasAccess: true, 
      accessType: 'global_super_admin',
      role: 'Super Admin'
    };
  }
  
  // If not a Super Admin, check direct workspace membership
  const [userWorkspace] = await db
    .select()
    .from(userWorkspaces)
    .where(
      and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, userId)
      )
    );
  
  if (userWorkspace) {
    return {
      hasAccess: true,
      accessType: 'member',
      role: userWorkspace.role
    };
  }
  
  return {
    hasAccess: false,
    accessType: 'none',
    role: null
  };
}