import { db } from '$lib/db/drizzle';
import { userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { WorkspaceRole } from '$lib/types/supabase';

/**
 * Verify a user has access to a workspace and return their role
 */
export async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string
): Promise<{ hasAccess: boolean; role: WorkspaceRole | null }> {
  console.log(`Verifying workspace access: userId=${userId}, workspaceId=${workspaceId}`);
  
  try {
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
      return { hasAccess: false, role: null };
    }

    console.log(`User ${userId} has access to workspace ${workspaceId} with role ${userWorkspaceData[0].role}`);
    return { hasAccess: true, role: userWorkspaceData[0].role };
  } catch (error) {
    console.error('Error verifying workspace access:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { hasAccess: false, role: null };
  }
}

/**
 * Check if a user has admin access to a workspace
 */
export async function hasAdminAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { hasAccess, role } = await verifyWorkspaceAccess(workspaceId, userId);
  return hasAccess && (role === 'Super Admin' || role === 'Admin');
}

/**
 * Check if a user has super admin access to a workspace
 */
export async function hasSuperAdminAccess(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  const { hasAccess, role } = await verifyWorkspaceAccess(workspaceId, userId);
  return hasAccess && role === 'Super Admin';
}