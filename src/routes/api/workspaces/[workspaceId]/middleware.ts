/**
 * Utility file for workspace ID routes
 * Contains helper functions for working with workspace IDs
 */

import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Log details about a workspace request for debugging
 */
export function logWorkspaceRequest(method: string, workspaceId: string, url: URL, headers: Headers) {
  console.log(`[API Debug] ${method} request for workspace ${workspaceId}`);
  console.log(`[API Debug] URL: ${url.toString()}`);
  // Log only essential headers for debugging
  console.log(`[API Debug] Content-Type:`, headers.get('content-type'));
}

/**
 * Check if a workspace exists and user has access
 */
export async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  // Check if workspace exists
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId));
    
  if (!workspace) {
    return { exists: false, hasAccess: false, role: null };
  }
  
  // Check if user has access
  const [userWorkspace] = await db
    .select()
    .from(userWorkspaces)
    .where(
      and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, userId)
      )
    );
    
  if (!userWorkspace) {
    return { exists: true, hasAccess: false, role: null };
  }
  
  return { exists: true, hasAccess: true, role: userWorkspace.role };
}