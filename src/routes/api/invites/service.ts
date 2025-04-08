import { db, userInvites, userWorkspaces, inviteStatusEnum, workspaceRoleEnum } from '$lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export interface InviteData {
  email: string;
  workspaceId: string;
  role: typeof workspaceRoleEnum.enumValues[number];
  invitedById: string;
}

export interface AcceptInviteData {
  token: string;
  userId: string;
}

export const inviteService = {
  /**
   * Create a new workspace invite
   */
  async createInvite({ email, workspaceId, role, invitedById }: InviteData) {
    // Generate a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Check if an invite already exists for this email and workspace
    const existingInvites = await db.select()
      .from(userInvites)
      .where(
        and(
          eq(userInvites.email, email),
          eq(userInvites.workspaceId, workspaceId),
          eq(userInvites.status, 'Pending')
        )
      );
    
    // If an invite already exists, return it
    if (existingInvites.length > 0) {
      return existingInvites[0];
    }
    
    // Create a new invite
    const [invite] = await db.insert(userInvites)
      .values({
        email,
        workspaceId,
        role,
        invitedById,
        token,
        expiresAt
      })
      .returning();
    
    return invite;
  },
  
  /**
   * Get all invites for a workspace
   */
  async getWorkspaceInvites(workspaceId: string) {
    return db.select()
      .from(userInvites)
      .where(eq(userInvites.workspaceId, workspaceId));
  },
  
  /**
   * Get all pending invites for an email
   */
  async getPendingInvitesByEmail(email: string) {
    return db.select()
      .from(userInvites)
      .where(
        and(
          eq(userInvites.email, email),
          eq(userInvites.status, 'Pending')
        )
      );
  },
  
  /**
   * Accept an invite and create a user-workspace relationship
   */
  async acceptInvite({ token, userId }: AcceptInviteData) {
    // Find the invite
    const [invite] = await db.select()
      .from(userInvites)
      .where(
        and(
          eq(userInvites.token, token),
          eq(userInvites.status, 'Pending')
        )
      );
    
    if (!invite) {
      throw new Error('Invalid or expired invite');
    }
    
    // Check if expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      // Update invite status to expired
      await db.update(userInvites)
        .set({ status: 'Expired' })
        .where(eq(userInvites.id, invite.id));
      
      throw new Error('Invite has expired');
    }
    
    // Update invite status to accepted
    await db.update(userInvites)
      .set({ 
        status: 'Accepted',
        acceptedAt: new Date()
      })
      .where(eq(userInvites.id, invite.id));
    
    // Create user-workspace relationship
    const [userWorkspace] = await db.insert(userWorkspaces)
      .values({
        userId,
        workspaceId: invite.workspaceId,
        role: invite.role
      })
      .returning();
    
    return {
      invite,
      userWorkspace
    };
  },
  
  /**
   * Get an invite by token
   */
  async getInviteByToken(token: string) {
    const [invite] = await db.select()
      .from(userInvites)
      .where(eq(userInvites.token, token));
    
    return invite;
  },
  
  /**
   * Decline an invite
   */
  async declineInvite(token: string) {
    // Find the invite
    const [invite] = await db.select()
      .from(userInvites)
      .where(
        and(
          eq(userInvites.token, token),
          eq(userInvites.status, 'Pending')
        )
      );
    
    if (!invite) {
      throw new Error('Invalid or expired invite');
    }
    
    // Update invite status to declined
    await db.update(userInvites)
      .set({ status: 'Declined' })
      .where(eq(userInvites.id, invite.id));
    
    return invite;
  }
};
