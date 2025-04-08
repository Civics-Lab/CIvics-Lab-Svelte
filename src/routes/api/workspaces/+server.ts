import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/workspaces - Get all workspaces for the current user
export const GET: RequestHandler = async ({ locals }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // First, get all workspace IDs the user has access to
    const userWorkspaceData = await db
      .select({ workspaceId: userWorkspaces.workspaceId, role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, user.id));
    
    if (!userWorkspaceData.length) {
      return json({ workspaces: [] });
    }
    
    // Extract workspace IDs
    const workspaceIds = userWorkspaceData.map(uw => uw.workspaceId);
    
    // Fetch the actual workspace data
    const workspaceData = await db
      .select()
      .from(workspaces)
      .where(inArray(workspaces.id, workspaceIds));
    
    // Combine workspace data with user roles
    const enrichedWorkspaces = workspaceData.map(workspace => {
      const userWorkspace = userWorkspaceData.find(uw => uw.workspaceId === workspace.id);
      return {
        ...workspace,
        userRole: userWorkspace ? userWorkspace.role : null
      };
    });
    
    return json({ workspaces: enrichedWorkspaces });
  } catch (err) {
    console.error('Error fetching workspaces:', err);
    throw error(500, 'Failed to fetch workspaces');
  }
};

// POST /api/workspaces - Create a new workspace
export const POST: RequestHandler = async ({ request, locals }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // Get the name from the request body
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw error(400, 'Workspace name is required');
    }
    
    // Insert the new workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: name.trim(),
        createdBy: user.id
      })
      .returning();
    
    if (!newWorkspace) {
      throw error(500, 'Failed to create workspace');
    }
    
    // Add user to workspace with Super Admin role
    await db
      .insert(userWorkspaces)
      .values({
        userId: user.id,
        workspaceId: newWorkspace.id,
        role: 'Super Admin'
      });
    
    return json({ workspace: newWorkspace }, { status: 201 });
  } catch (err) {
    console.error('Error creating workspace:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to create workspace');
  }
};
