// src/routes/api/invites/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { db, userInvites, users, userWorkspaces, workspaces } from '$lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
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
  
  // Get all invites for this workspace
  const invites = await db.query.userInvites.findMany({
    where: eq(userInvites.workspaceId, workspaceId),
    with: {
      invitedBy: {
        columns: {
          id: true,
          username: true,
          displayName: true
        }
      }
    }
  });
  
  return json({
    success: true,
    data: invites
  });
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
    
    // Check if the email has already been invited
    const existingInvite = await db.query.userInvites.findFirst({
      where: and(
        eq(userInvites.email, email.toLowerCase()),
        eq(userInvites.workspaceId, workspaceId),
        eq(userInvites.status, 'Pending')
      )
    });
    
    if (existingInvite) {
      throw error(400, 'This email has already been invited to this workspace');
    }
    
    // Check if the user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase())
    });
    
    if (existingUser) {
      // Check if user is already in the workspace
      const existingMember = await db.query.userWorkspaces.findFirst({
        where: and(
          eq(userWorkspaces.userId, existingUser.id),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      });
      
      if (existingMember) {
        throw error(400, 'This user is already a member of this workspace');
      }
      
      // Add the user directly to the workspace
      await db.insert(userWorkspaces).values({
        userId: existingUser.id,
        workspaceId,
        role
      });
      
      return json({
        success: true,
        message: 'User added to workspace',
        userAdded: true
      });
    }
    
    // Generate a token for the invite link
    const token = randomUUID();
    
    // Get workspace info for the email
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      columns: {
        name: true
      }
    });
    
    // Store the invitation
    const [newInvite] = await db.insert(userInvites)
      .values({
        email: email.toLowerCase(),
        workspaceId,
        role,
        invitedById: locals.user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      })
      .returning();
    
    // In a real application, you would send an email here
    // For now, we'll just return the invite link
    const baseUrl = env.BASE_URL || 'http://localhost:5173';
    const inviteLink = `${baseUrl}/signup?invite=${token}`;
    
    return json({
      success: true,
      message: 'Invitation sent',
      invite: newInvite,
      inviteLink,
      workspace: workspace?.name
    });
  } catch (err) {
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
    
    // Get the invite
    const invite = await db.query.userInvites.findFirst({
      where: and(
        eq(userInvites.id, inviteId),
        eq(userInvites.workspaceId, workspaceId)
      )
    });
    
    if (!invite) {
      throw error(404, 'Invite not found');
    }
    
    // Delete the invite
    await db.delete(userInvites)
      .where(eq(userInvites.id, inviteId));
    
    return json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    const statusCode = err instanceof Error && 'status' in err ? (err as any).status : 500;
    
    return json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
};
