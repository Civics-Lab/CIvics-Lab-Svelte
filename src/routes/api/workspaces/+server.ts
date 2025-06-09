import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces, users } from '$lib/db/drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import { isGlobalSuperAdmin } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// Handle creating a default workspace for a user with no workspaces
async function createDefaultWorkspace(userId: string) {
  try {
    console.log(`Creating default workspace for user ${userId}`);
    
    // First, check if the user exists in the database
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!userExists || userExists.length === 0) {
      console.error(`User with ID ${userId} not found in database`);
      throw new Error(`User with ID ${userId} not found in database`);
    }
    
    // Insert the new workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: 'My Workspace',
        createdBy: userId
      })
      .returning();
    
    if (!newWorkspace) {
      throw new Error('Failed to create default workspace');
    }
    
    // Add user to workspace with Super Admin role
    await db
      .insert(userWorkspaces)
      .values({
        userId,
        workspaceId: newWorkspace.id,
        role: 'Super Admin'
      });
    
    console.log(`Default workspace created: ${newWorkspace.id}`);
    
    return newWorkspace;
  } catch (err) {
    console.error('Error creating default workspace:', err);
    throw err;
  }
}

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
  
  try {
    // First, check if the user is a global Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    console.log(`User ${user.id} is global super admin:`, isSuperAdmin);
    
    if (isSuperAdmin) {
      // Global Super Admins see ALL workspaces
      console.log('Fetching all workspaces for global super admin');
      const allWorkspaces = await db
        .select()
        .from(workspaces);
      
      console.log('Found workspaces for global super admin:', allWorkspaces.map(ws => ({ id: ws.id, name: ws.name })));
      
      // Add userRole as 'Super Admin' for all workspaces for global super admins
      const enrichedWorkspaces = allWorkspaces.map(workspace => ({
        ...workspace,
        userRole: 'Super Admin' as const
      }));
      
      console.log('Returning all workspaces with Super Admin role for global super admin');
      
      return json({ 
        workspaces: enrichedWorkspaces,
        isGlobalSuperAdmin: true
      });
    }
    
    // Regular users - get workspaces they are explicitly members of
    console.log('Querying user_workspaces for regular user:', user.id);
    const userWorkspaceData = await db
      .select({ workspaceId: userWorkspaces.workspaceId, role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, user.id));
    
    console.log('Found user workspaces:', userWorkspaceData);
    
    // If no workspaces found, just return empty array
    if (!userWorkspaceData.length) {
      console.log('No workspaces found for user:', user.id);
      // Just return an empty array, let the client handle the empty state
      return json({ 
        workspaces: [],
        isGlobalSuperAdmin: false
      });
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
    
    // Check for nulls and filter them out to prevent errors
    const validWorkspaceData = workspaceData.filter(ws => ws !== null && ws !== undefined);
    
    // If there are workspaceIds but no valid workspaces found, something is wrong (deleted workspaces?)
    if (workspaceIds.length > 0 && validWorkspaceData.length === 0) {
      console.warn('Found workspace relationships but no valid workspaces. Creating default workspace...');
      try {
        const defaultWorkspace = await createDefaultWorkspace(user.id);
        
        // Return the newly created workspace
        return json({
          workspaces: [{
            ...defaultWorkspace,
            userRole: 'Super Admin'
          }],
          isGlobalSuperAdmin: false
        });
      } catch (createErr) {
        console.error('Failed to create default workspace:', createErr);
        return json({ 
          workspaces: [],
          isGlobalSuperAdmin: false
        });
      }
    }
    
    // Combine workspace data with user roles
    const enrichedWorkspaces = validWorkspaceData.map(workspace => {
      const userWorkspace = userWorkspaceData.find(uw => uw.workspaceId === workspace.id);
      return {
        ...workspace,
        userRole: userWorkspace ? userWorkspace.role : null
      };
    });
    
    console.log('Returning enriched workspaces for regular user:', 
      enrichedWorkspaces.map(ws => ({ id: ws.id, name: ws.name, role: ws.userRole })));
    
    return json({ 
      workspaces: enrichedWorkspaces,
      isGlobalSuperAdmin: false
    });
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
  
  try {
    // First, verify that the user exists in the database
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, user.id));
      
    if (!userExists || userExists.length === 0) {
      console.error(`User with ID ${user.id} not found in database`);
      throw error(404, 'User not found in database');
    }
    
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

// DEBUG endpoint to list user's workspaces and roles
export const OPTIONS: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    console.log(`DEBUG: Getting workspaces for user ${user.id}`);
    
    // Check if user is global super admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    // Get all workspaces the user has access to
    const userWorkspacesData = await db
      .select({
        userWorkspace: userWorkspaces,
        workspace: workspaces
      })
      .from(userWorkspaces)
      .innerJoin(workspaces, eq(userWorkspaces.workspaceId, workspaces.id))
      .where(eq(userWorkspaces.userId, user.id));
    
    // Extract just the data we need for debugging
    const debugData = userWorkspacesData.map(item => ({
      workspaceId: item.workspace.id,
      workspaceName: item.workspace.name,
      role: item.userWorkspace.role,
      userId: user.id,
      username: user.username
    }));
    
    console.log('User workspaces:', debugData);
    
    return json({ 
      debug: debugData,
      isGlobalSuperAdmin: isSuperAdmin 
    });
  } catch (err) {
    console.error('Error in debug endpoint:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Debug info failed');
  }
};
