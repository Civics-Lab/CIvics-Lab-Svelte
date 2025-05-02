import { json, error } from '@sveltejs/kit';
import { getInviteByToken, acceptInvitation } from '$lib/server/invites';
import type { RequestHandler } from './$types';

// GET /api/invites/[token] - Get an invitation by token
export const GET: RequestHandler = async ({ params }) => {
  const { token } = params;
  
  if (!token) {
    throw error(400, 'Invitation token is required');
  }
  
  try {
    const invite = await getInviteByToken(token);
    
    if (!invite) {
      throw error(404, 'Invitation not found');
    }
    
    // Check if the invitation has expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return json({
        success: false,
        message: 'Invitation has expired',
        invite: {
          ...invite,
          invitedAt: invite.invitedAt instanceof Date ? invite.invitedAt.toISOString() : invite.invitedAt,
          expiresAt: invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : invite.expiresAt,
          acceptedAt: invite.acceptedAt instanceof Date ? invite.acceptedAt.toISOString() : invite.acceptedAt
        }
      });
    }
    
    // Check if the invitation has already been accepted
    if (invite.status !== 'Pending') {
      return json({
        success: false,
        message: `Invitation has already been ${invite.status.toLowerCase()}`,
        invite: {
          ...invite,
          invitedAt: invite.invitedAt instanceof Date ? invite.invitedAt.toISOString() : invite.invitedAt,
          expiresAt: invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : invite.expiresAt,
          acceptedAt: invite.acceptedAt instanceof Date ? invite.acceptedAt.toISOString() : invite.acceptedAt
        }
      });
    }
    
    return json({
      success: true,
      invite: {
        ...invite,
        invitedAt: invite.invitedAt instanceof Date ? invite.invitedAt.toISOString() : invite.invitedAt,
        expiresAt: invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : invite.expiresAt,
        acceptedAt: invite.acceptedAt instanceof Date ? invite.acceptedAt.toISOString() : invite.acceptedAt
      }
    });
  } catch (err) {
    console.error('Error getting invitation by token:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to get invitation');
  }
};

// POST /api/invites/[token] - Accept an invitation
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { token } = params;
  const user = locals.user;
  
  if (!token) {
    throw error(400, 'Invitation token is required');
  }
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'accept') {
      const result = await acceptInvitation(token, user.id);
      
      return json({
        success: result.success,
        message: result.message
      });
    } else if (action === 'decline') {
      // For now, just return success - in the future we could mark the invitation as declined
      return json({
        success: true,
        message: 'Invitation declined'
      });
    } else {
      throw error(400, 'Invalid action specified');
    }
  } catch (err) {
    console.error('Error accepting/declining invitation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to process invitation');
  }
};