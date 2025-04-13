// src/routes/api/invites/[token]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { db, userInvites, workspaces } from '$lib/db/drizzle';
import { eq } from 'drizzle-orm';

// GET handler to get invite details
export const GET: RequestHandler = async ({ params }) => {
  try {
    const token = params.token;
    
    if (!token) {
      throw error(400, 'Invite token is required');
    }
    
    // Look up the invite
    const invite = await db.query.userInvites.findFirst({
      where: eq(userInvites.token, token),
      with: {
        workspace: {
          columns: {
            name: true
          }
        }
      }
    });
    
    if (!invite) {
      throw error(404, 'Invite not found');
    }
    
    // Check if expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return json({
        success: false,
        error: 'This invitation has expired',
        isExpired: true,
        invite: {
          email: invite.email,
          workspaceName: invite.workspace.name,
          role: invite.role,
          expiresAt: invite.expiresAt
        }
      });
    }
    
    // Check if already accepted
    if (invite.status !== 'Pending') {
      return json({
        success: false,
        error: 'This invitation has already been used',
        isUsed: true,
        invite: {
          email: invite.email,
          workspaceName: invite.workspace.name,
          role: invite.role,
          status: invite.status
        }
      });
    }
    
    return json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        workspaceId: invite.workspaceId,
        workspaceName: invite.workspace.name,
        role: invite.role,
        invitedAt: invite.invitedAt,
        expiresAt: invite.expiresAt
      }
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

// POST handler to accept or decline an invite
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const token = params.token;
    
    if (!token) {
      throw error(400, 'Invite token is required');
    }
    
    // Parse request body
    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'
    
    if (!action || (action !== 'accept' && action !== 'decline')) {
      throw error(400, 'Action must be "accept" or "decline"');
    }
    
    // Look up the invite
    const invite = await db.query.userInvites.findFirst({
      where: eq(userInvites.token, token)
    });
    
    if (!invite) {
      throw error(404, 'Invite not found');
    }
    
    // Check if expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return json({
        success: false,
        error: 'This invitation has expired'
      });
    }
    
    // Check if already accepted or declined
    if (invite.status !== 'Pending') {
      return json({
        success: false,
        error: `This invitation has already been ${invite.status.toLowerCase()}`
      });
    }
    
    // Update the invite status
    if (action === 'accept') {
      await db.update(userInvites)
        .set({ 
          status: 'Accepted',
          acceptedAt: new Date()
        })
        .where(eq(userInvites.id, invite.id));
      
      return json({
        success: true,
        message: 'Invitation accepted'
      });
    } else {
      await db.update(userInvites)
        .set({ 
          status: 'Declined',
          acceptedAt: new Date() // Using acceptedAt to track when it was declined
        })
        .where(eq(userInvites.id, invite.id));
      
      return json({
        success: true,
        message: 'Invitation declined'
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    const statusCode = err instanceof Error && 'status' in err ? (err as any).status : 500;
    
    return json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
};
