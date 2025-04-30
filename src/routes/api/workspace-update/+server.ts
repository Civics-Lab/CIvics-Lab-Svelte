import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH /api/workspace-update - Update a workspace using query parameters
export const PATCH: RequestHandler = async ({ url, request, locals }) => {
  // Get ID from query param
  const workspaceId = url.searchParams.get('id');
  const user = locals.user;
  
  console.log(`[SIMPLE-API] PATCH workspace-update with ID: ${workspaceId} from user ${user?.id}`);
  
  if (!workspaceId) {
    console.error('No workspace ID provided in query parameters');
    return json({ error: 'Workspace ID is required' }, { status: 400 });
  }
  
  if (!user) {
    console.error('No authenticated user found');
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    // First, check if the workspace exists
    console.log(`[SIMPLE-API] Checking if workspace ${workspaceId} exists`);
    const workspaceCheck = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    
    if (!workspaceCheck || workspaceCheck.length === 0) {
      console.error(`[SIMPLE-API] Workspace ${workspaceId} not found`);
      return json({ error: 'Workspace not found' }, { status: 404 });
    }
    
    // Check if the user has access to this workspace
    console.log(`[SIMPLE-API] Checking if user ${user.id} has access to workspace ${workspaceId}`);
    const userWorkspaceCheck = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, user.id),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspaceCheck || userWorkspaceCheck.length === 0) {
      console.error(`[SIMPLE-API] User ${user.id} does not have access to workspace ${workspaceId}`);
      return json({ error: 'You do not have permission to access this workspace' }, { status: 403 });
    }
    
    // Check if the user has admin permissions
    const userRole = userWorkspaceCheck[0].role;
    console.log(`[SIMPLE-API] User role: ${userRole}`);
    
    if (!['Super Admin', 'Admin'].includes(userRole)) {
      console.error(`[SIMPLE-API] User ${user.id} has role ${userRole} which cannot update the workspace`);
      return json(
        { error: 'You do not have permission to update this workspace' }, 
        { status: 403 }
      );
    }
    
    // Get update data from the request
    const body = await request.json();
    console.log('[SIMPLE-API] Request body:', body);
    
    // Validate update data
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      console.error('[SIMPLE-API] Invalid or missing name in request body');
      return json({ error: 'Valid workspace name is required' }, { status: 400 });
    }
    
    // Update the workspace
    console.log(`[SIMPLE-API] Updating workspace ${workspaceId} with name "${body.name}"`);
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({
        name: body.name.trim(),
        updatedAt: new Date()
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    // Check if update was successful
    if (!updatedWorkspace) {
      console.error('[SIMPLE-API] Failed to update workspace');
      return json({ error: 'Failed to update workspace' }, { status: 500 });
    }
    
    console.log('[SIMPLE-API] Workspace updated successfully:', updatedWorkspace);
    return json({ 
      workspace: updatedWorkspace,
      success: true,
      message: 'Workspace updated successfully'
    });
  } catch (err) {
    console.error('[SIMPLE-API] Error updating workspace:', err);
    return json(
      { 
        error: 'Failed to update workspace',
        message: err instanceof Error ? err.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};

// POST /api/workspace-update - Alternative method for browsers that don't handle PATCH
export const POST: RequestHandler = async (event) => {
  // Just delegate to the PATCH handler
  return await PATCH(event);
};
