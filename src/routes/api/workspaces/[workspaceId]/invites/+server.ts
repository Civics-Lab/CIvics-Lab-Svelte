import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userInvites } from '$lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
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
    // Get pending invites for this workspace
    const invites = await db.query.userInvites.findMany({
      where: and(
        eq(userInvites.workspaceId, workspaceId),
        eq(userInvites.status, 'Pending')
      ),
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
    
    console.log(`Found ${invites.length} pending invites for workspace ${workspaceId}`);
    
    // Convert dates to ISO strings for consistent serialization
    const serializedInvites = invites.map(invite => ({
      ...invite,
      invitedAt: invite.invitedAt?.toISOString(),
      expiresAt: invite.expiresAt?.toISOString(),
      acceptedAt: invite.acceptedAt?.toISOString()
    }));
    
    return json({ invites: serializedInvites });
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
    
    // Generate a token for the invite
    const token = crypto.randomUUID();
    
    // Store the invitation
    const newInvite = await db.insert(userInvites).values({
      email: email.toLowerCase(),
      workspaceId,
      role: inviteRole || 'Basic User', // Default role if not specified
      invitedById: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }).returning();
    
    // Get the full invite data to return
    const createdInvite = await db.query.userInvites.findFirst({
      where: eq(userInvites.id, newInvite[0].id),
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
    
    // Convert dates for serialization
    const serializedInvite = {
      ...createdInvite,
      invitedAt: createdInvite?.invitedAt?.toISOString(),
      expiresAt: createdInvite?.expiresAt?.toISOString(),
      acceptedAt: createdInvite?.acceptedAt?.toISOString()
    };
    
    // Create invite link
    const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
    const inviteLink = `${baseUrl}/signup?invite=${token}`;
    
    return json({ 
      success: true,
      message: 'Invitation created',
      invite: serializedInvite,
      inviteLink
    });
  } catch (err) {
    console.error('Error creating workspace invite:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to create invitation');
  }
};