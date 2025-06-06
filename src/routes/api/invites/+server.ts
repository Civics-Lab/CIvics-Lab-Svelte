// src/routes/api/invites/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { db, userInvites, users, userWorkspaces, workspaces } from '$lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { createInvitation, listPendingInvites, cancelInvitation } from '$lib/server/invites';
import { env } from '$env/dynamic/private';

// GET handler to fetch all invites for the current user's workspace
export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) {
    throw error(401, 'You must be logged in to access invites');
  }
  
  const workspaceId = locals.currentWorkspace?.id;
  
  if (!workspaceId) {
    throw error(400, 'No workspace selected');
  }
  
  // Verify user has access to this workspace
  const userWorkspace = await db.query.userWorkspaces.findFirst({
    where: and(
      eq(userWorkspaces.userId, locals.user.id),
      eq(userWorkspaces.workspaceId, workspaceId)
    )
  });
  
  if (!userWorkspace) {
    throw error(403, 'You do not have access to this workspace');
  }
  
  try {
    // Get all pending invites for this workspace using the service
    const invites = await listPendingInvites(workspaceId);
    
    return json({
      success: true,
      data: invites
    });
  } catch (err) {
    console.error('Error fetching invites:', err);
    return json({
      success: false,
      error: 'Failed to fetch invites'
    }, { status: 500 });
  }
};

// POST handler to create a new invite
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      throw error(401, 'You must be logged in to create invites');
    }
    
    const workspaceId = locals.currentWorkspace?.id;
    
    if (!workspaceId) {
      throw error(400, 'No workspace selected');
    }
    
    // Verify user has admin rights in this workspace
    const userWorkspace = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, locals.user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    });
    
    if (!userWorkspace || (userWorkspace.role !== 'Super Admin' && userWorkspace.role !== 'Admin')) {
      throw error(403, 'You do not have permission to create invites');
    }
    
    // Parse request body
    const body = await request.json();
    const { email, role } = body;
    
    if (!email || !role) {
      throw error(400, 'Email and role are required');
    }
    
    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw error(400, 'Invalid email address');
    }
    
    // Use the invitation service to create the invite
    const result = await createInvitation({
      email,
      workspaceId,
      role,
      invitedById: locals.user.id,
      isSuperAdmin: false
    });
    
    if (!result.success) {
      return json({
        success: false,
        error: result.message
      }, { status: 400 });
    }
    
    // Get workspace info for response
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      columns: {
        name: true
      }
    });
    
    return json({
      success: true,
      message: result.message,
      invite: result.invite,
      inviteLink: result.inviteLink,
      workspace: workspace?.name,
      userAdded: result.message === 'User added to workspace'
    });
  } catch (err) {
    console.error('Error creating invite:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    const statusCode = err instanceof Error && 'status' in err ? (err as any).status : 500;
    
    return json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
};

// DELETE handler to cancel an invite
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      throw error(401, 'You must be logged in to cancel invites');
    }
    
    const workspaceId = locals.currentWorkspace?.id;
    
    if (!workspaceId) {
      throw error(400, 'No workspace selected');
    }
    
    // Verify user has admin rights in this workspace
    const userWorkspace = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, locals.user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    });
    
    if (!userWorkspace || (userWorkspace.role !== 'Super Admin' && userWorkspace.role !== 'Admin')) {
      throw error(403, 'You do not have permission to cancel invites');
    }
    
    // Parse request body
    const body = await request.json();
    const { inviteId } = body;
    
    if (!inviteId) {
      throw error(400, 'Invite ID is required');
    }
    
    // Verify the invite belongs to this workspace
    const invite = await db.query.userInvites.findFirst({
      where: and(
        eq(userInvites.id, inviteId),
        eq(userInvites.workspaceId, workspaceId)
      )
    });
    
    if (!invite) {
      throw error(404, 'Invite not found');
    }
    
    // Use the invitation service to cancel the invite
    const result = await cancelInvitation(inviteId);
    
    if (!result.success) {
      return json({
        success: false,
        error: result.message
      }, { status: 400 });
    }
    
    return json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Error cancelling invite:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    const statusCode = err instanceof Error && 'status' in err ? (err as any).status : 500;
    
    return json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
};
