import { db } from '$lib/db/drizzle';
import { userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { MiddlewareHandler } from 'hono';

/**
 * Middleware to verify user has access to a workspace
 */
export const verifyWorkspaceAccess: MiddlewareHandler = async (c, next) => {
  // Get the current user from context
  const user = c.get('user');
  if (!user) {
    return c.json({
      success: false,
      error: 'Authentication required'
    }, 401);
  }
  
  // Get the workspace ID from the path or body
  const workspaceId = c.req.param('workspaceId') || c.req.valid('json')?.workspaceId;
  
  if (!workspaceId) {
    return c.json({
      success: false,
      error: 'Workspace ID is required'
    }, 400);
  }
  
  // Check if the user has access to this workspace
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
    return c.json({
      success: false,
      error: 'You do not have access to this workspace'
    }, 403);
  }
  
  // Store the user workspace in context
  c.set('userWorkspace', userWorkspace[0]);
  
  return next();
};
