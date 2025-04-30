import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/workspace-by-id?id=... - Alternative way to get a workspace
export const GET: RequestHandler = async ({ url, locals }) => {
  const workspaceId = url.searchParams.get('id');
  const user = locals.user;
  
  console.log(`[API] GET workspace-by-id with ID ${workspaceId}, user ${user?.id}`);
  
  if (!user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  if (!workspaceId) {
    return json({ error: 'Workspace ID is required' }, { status: 400 });
  }
  
  try {
    // First check if the workspace exists
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
      
    if (!workspace) {
      console.log(`[API] Workspace ${workspaceId} not found`);
      return json({ error: 'Workspace not found' }, { status: 404 });
    }
    
    // Then check if the user has access
    const [userWorkspace] = await db
      .select()
      .from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      ));
      
    if (!userWorkspace) {
      console.log(`[API] User ${user.id} does not have access to workspace ${workspaceId}`);
      return json({ error: 'You do not have access to this workspace' }, { status: 403 });
    }
    
    console.log(`[API] Found workspace ${workspaceId} for user ${user.id}`);
    return json({
      workspace,
      userRole: userWorkspace.role,
      handler: 'workspace-by-id'
    });
  } catch (err) {
    console.error('Error fetching workspace:', err);
    return json({ error: 'Failed to fetch workspace' }, { status: 500 });
  }
};

// PATCH /api/workspace-by-id?id=... - Update a workspace
export const PATCH: RequestHandler = async ({ url, request, locals }) => {
  const workspaceId = url.searchParams.get('id');
  const user = locals.user;
  
  console.log(`[API] PATCH workspace-by-id with ID ${workspaceId}, user ${user?.id}`);
  
  if (!user) {
    return json({ error: 'Authentication required' }, { status: 401 });
  }
  
  if (!workspaceId) {
    return json({ error: 'Workspace ID is required' }, { status: 400 });
  }
  
  try {
    // First check if the workspace exists
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
      
    if (!workspace) {
      console.log(`[API] Workspace ${workspaceId} not found`);
      return json({ error: 'Workspace not found' }, { status: 404 });
    }
    
    // Then check if the user has access with appropriate role
    const [userWorkspace] = await db
      .select()
      .from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      ));
      
    if (!userWorkspace) {
      console.log(`[API] User ${user.id} does not have access to workspace ${workspaceId}`);
      return json({ error: 'You do not have access to this workspace' }, { status: 403 });
    }
    
    if (!['Super Admin', 'Admin'].includes(userWorkspace.role)) {
      console.log(`[API] User ${user.id} does not have permission to update workspace ${workspaceId}`);
      return json({ error: 'You do not have permission to update this workspace' }, { status: 403 });
    }
    
    // Get the data from the request
    const data = await request.json();
    console.log(`[API] Update data:`, data);
    
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      return json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Update the workspace
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({
        name: data.name.trim(),
        updatedAt: new Date()
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
      
    if (!updatedWorkspace) {
      console.log(`[API] Failed to update workspace ${workspaceId}`);
      return json({ error: 'Failed to update workspace' }, { status: 500 });
    }
    
    console.log(`[API] Successfully updated workspace ${workspaceId}`);
    return json({
      workspace: updatedWorkspace,
      handler: 'workspace-by-id'
    });
  } catch (err) {
    console.error('Error updating workspace:', err);
    return json({ error: 'Failed to update workspace' }, { status: 500 });
  }
};
