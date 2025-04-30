// Helper file for debugging workspace ID API issues
// This file name does not use the reserved + prefix pattern

import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { Workspace } from '$lib/types/supabase';

/**
 * Direct database lookup for a workspace by ID
 */
export async function findWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  try {
    console.log(`[DEBUG] Looking up workspace ID: ${workspaceId}`);
    
    // Direct DB query to fetch the workspace
    const workspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    
    if (!workspace || workspace.length === 0) {
      console.log(`[DEBUG] Workspace ID ${workspaceId} not found in database`);
      return null;
    }
    
    console.log(`[DEBUG] Found workspace: ${workspace[0].name}`);
    return workspace[0];
  } catch (error) {
    console.error(`[DEBUG] Error finding workspace by ID:`, error);
    return null;
  }
}

/**
 * Direct database check for user access to workspace
 */
export async function checkUserWorkspaceAccess(
  userId: string, 
  workspaceId: string
): Promise<{ hasAccess: boolean; role: string | null }> {
  try {
    console.log(`[DEBUG] Checking user ${userId} access to workspace ${workspaceId}`);
    
    // Direct DB query to check access
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, userId),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      console.log(`[DEBUG] User ${userId} does not have access to workspace ${workspaceId}`);
      return { hasAccess: false, role: null };
    }
    
    console.log(`[DEBUG] User has access with role: ${userWorkspace[0].role}`);
    return { hasAccess: true, role: userWorkspace[0].role };
  } catch (error) {
    console.error(`[DEBUG] Error checking user access:`, error);
    return { hasAccess: false, role: null };
  }
}
