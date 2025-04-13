import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/workspaces - Get all workspaces for the current user
export const GET: RequestHandler = async ({ locals }) => {
  console.log('API: GET /api/workspaces - Start');
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    console.error('No authenticated user found in locals');
    throw error(401, 'Authentication required');
  }
  
  console.log('API: Getting workspaces for user:', user.id);
  
  // We don't use verifyWorkspaceAccess here because we're getting all workspaces for the user
  
  try {
    // First, get all workspace IDs the user has access to
    console.log('Querying user_workspaces for user:', user.id);
    const userWorkspaceData = await db
      .select({ workspaceId: userWorkspaces.workspaceId, role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, user.id));
    
    console.log('Found user workspaces:', userWorkspaceData);
    
    if (!userWorkspaceData.length) {
      console.log('No workspaces found for user:', user.id);
      return json({ workspaces: [] });
    }
    
    // Extract workspace IDs
    const workspaceIds = userWorkspaceData.map(uw => uw.workspaceId);
    console.log('Workspace IDs to fetch:', workspaceIds);
    
    // Fetch the actual workspace data
    const workspaceData = await db
      .select()
      .from(workspaces)
      .where(inArray(workspaces.id, workspaceIds));
    
    console.log('Fetched workspace data:', workspaceData.map(ws => ({ id: ws.id, name: ws.name })));
    
    // Combine workspace data with user roles
    const enrichedWorkspaces = workspaceData.map(workspace => {
      const userWorkspace = userWorkspaceData.find(uw => uw.workspaceId === workspace.id);
      return {
        ...workspace,
        userRole: userWorkspace ? userWorkspace.role : null
      };
    });
    
    console.log('Returning enriched workspaces:', 
      enrichedWorkspaces.map(ws => ({ id: ws.id, name: ws.name, role: ws.userRole })));
    
    return json({ workspaces: enrichedWorkspaces });
  } catch (err) {
    console.error('Error fetching workspaces:', err);
    if (err instanceof Error) {
      console.error('Error details:', err.message);
      console.error('Error stack:', err.stack);
    }
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
  // Authentication check is sufficient for workspace creation - no workspace to check access for yet
  
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
