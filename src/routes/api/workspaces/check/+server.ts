import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/workspaces/check - Check if a workspace exists
export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  const workspaceId = url.searchParams.get('id');
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  if (!workspaceId) {
    throw error(400, 'Workspace ID is required');
  }
  
  try {
    console.log(`Checking workspace ${workspaceId}`);
    
    // First, check if the workspace exists in the database
    const workspaceExists = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
    
    if (!workspaceExists || workspaceExists.length === 0) {
      return json({
        exists: false,
        hasAccess: false,
        role: null,
        message: 'Workspace not found in database'
      });
    }
    
    // Then check if the user has access to this workspace
    const userWorkspaceData = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, workspaceId),
          eq(userWorkspaces.userId, user.id)
        )
      )
      .limit(1);
    
    if (!userWorkspaceData || userWorkspaceData.length === 0) {
      return json({
        exists: true,
        hasAccess: false,
        role: null,
        message: 'User does not have access to this workspace'
      });
    }
    
    // User has access to this workspace
    return json({
      exists: true,
      hasAccess: true,
      role: userWorkspaceData[0].role,
      message: 'User has access to this workspace'
    });
    
  } catch (err) {
    console.error('Error checking workspace:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to check workspace');
  }
};
