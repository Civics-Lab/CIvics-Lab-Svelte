import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Verifies that a user is authenticated and has access to the specified workspace
 * @param user The authenticated user from locals
 * @param workspaceId The workspace ID to check access for
 * @returns The user workspace data if access is allowed
 * @throws 401 if user is not authenticated, 400 if workspaceId is missing, 403 if access denied
 */
export async function verifyWorkspaceAccess(user: any, workspaceId: string | null) {
  // Check authentication
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Check workspace ID
  if (!workspaceId) {
    throw error(400, 'Workspace ID is required');
  }
  
  // Check workspace access
  const userWorkspace = await db
    .select()
    .from(userWorkspaces)
    .where(
      and(
        eq(userWorkspaces.userId, user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    )
    .limit(1);
  
  if (!userWorkspace || userWorkspace.length === 0) {
    throw error(403, 'You do not have access to this workspace');
  }
  
  return userWorkspace[0];
}

/**
 * Verifies that a user is authenticated and has access to the workspace that owns a resource
 * @param user The authenticated user from locals
 * @param resourceId The ID of the resource
 * @param resourceTable The database table containing the resource
 * @returns Object containing the resource and userWorkspace data
 * @throws 401 if user is not authenticated, 404 if resource not found, 403 if access denied
 */
export async function verifyResourceAccess<T extends { id: string, workspaceId: string }>(
  user: any,
  resourceId: string,
  resourceTable: any
) {
  // Check authentication
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Fetch the resource to get its workspace
  const [resource] = await db
    .select()
    .from(resourceTable)
    .where(eq(resourceTable.id, resourceId))
    .limit(1);
  
  if (!resource) {
    throw error(404, 'Resource not found');
  }
  
  // Check workspace access
  const userWorkspace = await db
    .select()
    .from(userWorkspaces)
    .where(
      and(
        eq(userWorkspaces.userId, user.id),
        eq(userWorkspaces.workspaceId, resource.workspaceId)
      )
    )
    .limit(1);
  
  if (!userWorkspace || userWorkspace.length === 0) {
    throw error(403, 'You do not have access to this resource');
  }
  
  return { resource, userWorkspace: userWorkspace[0] };
}
