import { db } from '$lib/server/db';
import { userWorkspaces, workspaces, users } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { WorkspaceRole } from '$lib/types/supabase';

/**
 * Check if a user is a global Super Admin
 */
export async function isGlobalSuperAdmin(userId: string): Promise<boolean> {
  try {
    const userResult = await db
      .select({ 
        isGlobalSuperAdmin: users.isGlobalSuperAdmin
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return userResult.length > 0 && userResult[0].isGlobalSuperAdmin === true;
  } catch (error) {
    console.error('Error checking global Super Admin status:', error);
    return false;
  }
}

/**
 * Verify a user has access to a workspace and return their role
 */
export async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<{ hasAccess: boolean; role: WorkspaceRole | null; exists: boolean; isGlobalSuperAdmin?: boolean }> {
  console.log(`Verifying workspace access: userId=${userId}, workspaceId=${workspaceId}`);
  
  try {
    // First, check if the user is a global Super Admin
    try {
      const isSuperAdmin = await isGlobalSuperAdmin(userId);
      
      if (isSuperAdmin) {
        console.log(`User ${userId} is a global Super Admin with access to all workspaces`);
        
        // Check if the workspace exists for global Super Admins
        const workspaceExists = await db
          .select({ id: workspaces.id, name: workspaces.name })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);
        
        if (!workspaceExists.length) {
          console.log(`Workspace ${workspaceId} does not exist (checked by global Super Admin)`);
          return { hasAccess: false, role: null, exists: false, isGlobalSuperAdmin: true };
        }
        
        console.log(`Global Super Admin accessing workspace: ${workspaceExists[0].name}`);
        return { 
          hasAccess: true, 
          role: 'Super Admin', 
          exists: true,
          isGlobalSuperAdmin: true 
        };
      }
    } catch (superAdminError) {
      // If there's an error checking global Super Admin status (like missing column),
      // log it but continue with regular workspace access check
      console.warn('Error checking global Super Admin status - continuing with regular access check:', superAdminError);
    }
    
    // Check if the workspace exists
    const workspaceExists = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    
    if (!workspaceExists.length) {
      console.log(`Workspace ${workspaceId} does not exist`);
      return { hasAccess: false, role: null, exists: false };
    }
    
    // Check if user has access to the workspace
    const userWorkspaceData = await db
      .select({ role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, workspaceId),
          eq(userWorkspaces.userId, userId)
        )
      )
      .limit(1);

    console.log(`User workspace data:`, userWorkspaceData);

    if (!userWorkspaceData.length) {
      console.log(`User ${userId} does not have access to workspace ${workspaceId}`);
      return { hasAccess: false, role: null, exists: true };
    }

    console.log(`User ${userId} has access to workspace ${workspaceId} with role ${userWorkspaceData[0].role}`);
    return { hasAccess: true, role: userWorkspaceData[0].role, exists: true };
  } catch (error) {
    console.error('Error verifying workspace access:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { hasAccess: false, role: null, exists: false };
  }
}

/**
 * Check if a user has admin access to a workspace
 */
export async function hasAdminAccess(
  workspaceId: string,
  userId: string
): Promise<{ hasPermission: boolean; exists: boolean }> {
  const { hasAccess, role, exists, isGlobalSuperAdmin } = await verifyWorkspaceAccess(workspaceId, userId);
  return { 
    hasPermission: hasAccess && (role === 'Super Admin' || role === 'Admin' || isGlobalSuperAdmin === true),
    exists
  };
}

/**
 * Check if a user has super admin access to a workspace
 */
export async function hasSuperAdminAccess(
  workspaceId: string,
  userId: string
): Promise<{ hasPermission: boolean; exists: boolean }> {
  const { hasAccess, role, exists, isGlobalSuperAdmin } = await verifyWorkspaceAccess(workspaceId, userId);
  return { 
    hasPermission: hasAccess && (role === 'Super Admin' || isGlobalSuperAdmin === true),
    exists
  };
}