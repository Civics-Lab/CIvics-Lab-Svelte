import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userWorkspaces } from '$lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/workspaces/[workspaceId]/members/[userId] - Get a specific workspace member
export const GET: RequestHandler = async ({ params, locals }) => {
  const { workspaceId, userId } = params;
  const user = locals.user;
  
  console.log(`GET workspace member ${userId} in workspace ${workspaceId} request from user ${user?.id}`);
  
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
    // Get the specific workspace member
    const member = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, userId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            username: true,
            displayName: true
          }
        }
      }
    });
    
    if (!member) {
      throw error(404, 'Member not found in this workspace');
    }
    
    // Convert dates to ISO strings for consistent serialization
    const serializedMember = {
      ...member,
      createdAt: member.createdAt?.toISOString(),
      updatedAt: member.updatedAt?.toISOString()
    };
    
    return json({ member: serializedMember });
  } catch (err) {
    console.error('Error fetching workspace member:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to fetch workspace member');
  }
};

// PATCH /api/workspaces/[workspaceId]/members/[userId] - Update a member's role
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const { workspaceId, userId } = params;
  const user = locals.user;
  
  console.log(`PATCH update member ${userId} in workspace ${workspaceId} request from user ${user?.id}`);
  
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
    throw error(403, 'You do not have permission to update member roles in this workspace');
  }
  
  try {
    const body = await request.json();
    const { role: newRole } = body;
    
    if (!newRole) {
      throw error(400, 'Role is required');
    }
    
    // Get the existing member relationship
    const memberRelationship = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, userId)
      )
    });
    
    if (!memberRelationship) {
      throw error(404, 'Member not found in this workspace');
    }
    
    // Don't allow super admins to downgrade themselves
    if (userId === user.id && memberRelationship.role === 'Super Admin' && newRole !== 'Super Admin') {
      throw error(400, 'You cannot downgrade your own Super Admin role');
    }
    
    // Update the role
    const [updatedMember] = await db.update(userWorkspaces)
      .set({ role: newRole, updatedAt: new Date() })
      .where(and(
        eq(userWorkspaces.workspaceId, workspaceId),
        eq(userWorkspaces.userId, userId)
      ))
      .returning();
    
    // Get the full updated member with user details
    const fullUpdatedMember = await db.query.userWorkspaces.findFirst({
      where: eq(userWorkspaces.id, updatedMember.id),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            username: true,
            displayName: true
          }
        }
      }
    });
    
    // Convert dates for serialization
    const serializedMember = {
      ...fullUpdatedMember,
      createdAt: fullUpdatedMember?.createdAt?.toISOString(),
      updatedAt: fullUpdatedMember?.updatedAt?.toISOString()
    };
    
    return json({ 
      success: true,
      message: 'Member role updated',
      member: serializedMember
    });
  } catch (err) {
    console.error('Error updating member role:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to update member role');
  }
};

// DELETE /api/workspaces/[workspaceId]/members/[userId] - Remove a member from workspace
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { workspaceId, userId } = params;
  const user = locals.user;
  
  console.log(`DELETE remove member ${userId} from workspace ${workspaceId} request from user ${user?.id}`);
  
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
    throw error(403, 'You do not have permission to remove members from this workspace');
  }
  
  // Don't allow removing self
  if (userId === user.id) {
    throw error(400, 'You cannot remove yourself from the workspace');
  }
  
  try {
    // Get the user's workspace relationship
    const memberRelationship = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    });
    
    if (!memberRelationship) {
      throw error(404, 'Member not found in this workspace');
    }
    
    // Delete the relationship
    const [removedMember] = await db.delete(userWorkspaces)
      .where(eq(userWorkspaces.id, memberRelationship.id))
      .returning();
    
    return json({
      success: true,
      message: 'Member removed from workspace',
      removedMemberId: userId
    });
  } catch (err) {
    console.error('Error removing member from workspace:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to remove member from workspace');
  }
};