import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userInvites } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import { cancelInvitation } from '$lib/server/invites';
import type { RequestHandler } from './$types';

// DELETE /api/workspaces/[workspaceId]/invites/[inviteId] - Cancel a workspace invitation
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { workspaceId, inviteId } = params;
  const user = locals.user;
  
  console.log(`DELETE cancel invite ${inviteId} for workspace ${workspaceId} request from user ${user?.id}`);
  
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
    throw error(403, 'You do not have permission to cancel invites for this workspace');
  }
  
  try {
    // Cancel the invitation
    const result = await cancelInvitation(inviteId);
    
    if (!result.success) {
      throw error(400, result.message);
    }
    
    return json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (err) {
    console.error('Error cancelling workspace invite:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to cancel invitation');
  }
};

// GET /api/workspaces/[workspaceId]/invites/[inviteId] - Get a specific invitation
export const GET: RequestHandler = async ({ params, locals }) => {
  const { workspaceId, inviteId } = params;
  const user = locals.user;
  
  console.log(`GET invite ${inviteId} for workspace ${workspaceId} request from user ${user?.id}`);
  
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
    // Get the invitation
    const invite = await db.select()
      .from(userInvites)
      .where(and(
        eq(userInvites.id, inviteId),
        eq(userInvites.workspaceId, workspaceId)
      ))
      .limit(1);
    
    if (!invite || invite.length === 0) {
      throw error(404, 'Invitation not found');
    }
    
    return json({
      success: true,
      invite: {
        ...invite[0],
        invitedAt: invite[0].invitedAt instanceof Date ? invite[0].invitedAt.toISOString() : invite[0].invitedAt,
        expiresAt: invite[0].expiresAt instanceof Date ? invite[0].expiresAt.toISOString() : invite[0].expiresAt,
        acceptedAt: invite[0].acceptedAt instanceof Date ? invite[0].acceptedAt.toISOString() : invite[0].acceptedAt
      }
    });
  } catch (err) {
    console.error('Error getting workspace invite:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to get invitation');
  }
};