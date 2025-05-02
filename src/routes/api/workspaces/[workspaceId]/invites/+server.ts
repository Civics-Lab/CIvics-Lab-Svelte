import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userInvites, users } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import { createInvitation, listPendingInvites } from '$lib/server/invites';
import type { RequestHandler } from './$types';

// GET /api/workspaces/[workspaceId]/invites - Get pending invites for a workspace
export const GET: RequestHandler = async ({ params, locals }) => {
  const { workspaceId } = params;
  const user = locals.user;
  
  console.log(`GET workspace invites for ${workspaceId} request from user ${user?.id}`);
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Verify user has access to this workspace
  const { hasAccess, exists } = await verifyWorkspaceAccess(workspaceId, user.id);
  
  console.log(`Workspace access check: exists=${exists}, hasAccess=${hasAccess}`);
  
  // If workspace doesn't exist, return a 404
  if (!exists) {
    throw error(404, 'Workspace not found');
  }
  
  // If user doesn't have access, return a 403
  if (!hasAccess) {
    throw error(403, 'You do not have permission to access this workspace');
  }
  
  try {
    // Get all pending invites for this workspace
    const invites = await listPendingInvites(workspaceId);
    
    console.log(`Found ${invites.length} pending invites for workspace ${workspaceId}`);
    return json({ invites });
  } catch (err) {
    console.error('Error fetching workspace invites:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    // Provide more detailed error message
    if (err instanceof Error) {
      throw error(500, `Failed to fetch workspace invites: ${err.message}`);
    }
    
    throw error(500, 'Failed to fetch workspace invites');
  }
};

// POST /api/workspaces/[workspaceId]/invites - Create a new invite for a workspace
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { workspaceId } = params;
  const user = locals.user;
  
  console.log(`POST create invite for workspace ${workspaceId} request from user ${user?.id}`);
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Verify user has admin access to this workspace
  const { hasAccess, role, exists } = await verifyWorkspaceAccess(workspaceId, user.id);
  
  console.log(`Workspace access check: exists=${exists}, hasAccess=${hasAccess}, role=${role}`);
  
  // If workspace doesn't exist, return a 404
  if (!exists) {
    throw error(404, 'Workspace not found');
  }
  
  // If user doesn't have access or isn't an admin, return a 403
  if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
    throw error(403, 'You do not have permission to create invites for this workspace');
  }
  
  try {
    const body = await request.json();
    const { email, role: inviteRole } = body;
    
    if (!email) {
      throw error(400, 'Email is required');
    }
    
    // Create the invitation using our service
    const result = await createInvitation({
      email: email.toLowerCase(),
      workspaceId,
      role: inviteRole || 'Basic User',
      invitedById: user.id
    });
    
    if (!result.success) {
      throw error(400, result.message);
    }
    
    return json({
      success: true,
      message: result.message,
      invite: result.invite,
      inviteLink: result.inviteLink
    });
  } catch (err) {
    console.error('Error creating workspace invite:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to create invitation');
  }
};