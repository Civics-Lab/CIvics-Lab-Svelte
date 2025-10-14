import { createInvitation, listPendingInvites, cancelInvitation, getInviteByToken, acceptInvitation } from '$lib/server/invites';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { userWorkspaces, workspaces, userInvites } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const inviteService = {
  async getInvitesForWorkspace(workspaceId: string, userId: string) {
    // Verify user has access to this workspace
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have access to this workspace');
    }

    // Get all pending invites for this workspace
    const invites = await listPendingInvites(workspaceId);
    return { invites };
  },

  async createInvite(workspaceId: string, userId: string, email: string, role: string) {
    if (!email || !role) {
      throw new Error('Email and role are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }

    // Verify user has admin rights in this workspace
    const userWorkspace = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    });

    if (!userWorkspace || (userWorkspace.role !== 'Super Admin' && userWorkspace.role !== 'Admin')) {
      throw new Error('You do not have permission to create invites');
    }

    // Create the invitation
    const result = await createInvitation({
      email,
      workspaceId,
      role,
      invitedById: userId,
      isSuperAdmin: false
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    // Get workspace info
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      columns: {
        name: true
      }
    });

    return {
      message: result.message,
      invite: result.invite,
      inviteLink: result.inviteLink,
      workspace: workspace?.name,
      userAdded: result.message === 'User added to workspace'
    };
  },

  async cancelInvite(workspaceId: string, userId: string, inviteId: string) {
    if (!inviteId) {
      throw new Error('Invite ID is required');
    }

    // Verify user has admin rights in this workspace
    const userWorkspace = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    });

    if (!userWorkspace || (userWorkspace.role !== 'Super Admin' && userWorkspace.role !== 'Admin')) {
      throw new Error('You do not have permission to cancel invites');
    }

    // Verify the invite belongs to this workspace
    const invite = await db.query.userInvites.findFirst({
      where: and(
        eq(userInvites.id, inviteId),
        eq(userInvites.workspaceId, workspaceId)
      )
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    // Cancel the invitation
    const result = await cancelInvitation(inviteId);

    if (!result.success) {
      throw new Error(result.message);
    }

    return { message: result.message };
  },

  async getInviteByToken(token: string) {
    if (!token) {
      throw new Error('Invitation token is required');
    }

    const invite = await getInviteByToken(token);

    if (!invite) {
      throw new Error('Invitation not found');
    }

    // Check if the invitation has expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return {
        success: false,
        message: 'Invitation has expired',
        invite: {
          ...invite,
          invitedAt: invite.invitedAt instanceof Date ? invite.invitedAt.toISOString() : invite.invitedAt,
          expiresAt: invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : invite.expiresAt,
          acceptedAt: invite.acceptedAt instanceof Date ? invite.acceptedAt.toISOString() : invite.acceptedAt
        }
      };
    }

    // Check if the invitation has already been accepted
    if (invite.status !== 'Pending') {
      return {
        success: false,
        message: `Invitation has already been ${invite.status.toLowerCase()}`,
        invite: {
          ...invite,
          invitedAt: invite.invitedAt instanceof Date ? invite.invitedAt.toISOString() : invite.invitedAt,
          expiresAt: invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : invite.expiresAt,
          acceptedAt: invite.acceptedAt instanceof Date ? invite.acceptedAt.toISOString() : invite.acceptedAt
        }
      };
    }

    return {
      success: true,
      invite: {
        ...invite,
        invitedAt: invite.invitedAt instanceof Date ? invite.invitedAt.toISOString() : invite.invitedAt,
        expiresAt: invite.expiresAt instanceof Date ? invite.expiresAt.toISOString() : invite.expiresAt,
        acceptedAt: invite.acceptedAt instanceof Date ? invite.acceptedAt.toISOString() : invite.acceptedAt
      }
    };
  },

  async processInvite(token: string, userId: string, action: 'accept' | 'decline') {
    if (!token) {
      throw new Error('Invitation token is required');
    }

    if (!userId) {
      throw new Error('Authentication required');
    }

    if (action === 'accept') {
      const result = await acceptInvitation(token, userId);
      return {
        success: result.success,
        message: result.message
      };
    } else if (action === 'decline') {
      // For now, just return success - in the future we could mark the invitation as declined
      return {
        success: true,
        message: 'Invitation declined'
      };
    } else {
      throw new Error('Invalid action specified');
    }
  }
};