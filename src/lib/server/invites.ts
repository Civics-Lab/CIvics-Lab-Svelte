// src/lib/server/invites.ts
import { db } from '$lib/server/db';
import { userInvites, users, userWorkspaces, workspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { sendInviteEmail, sendSuperAdminInviteEmail } from './email';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import type { WorkspaceRole } from '$lib/types/supabase';

/**
 * Check if a user exists with the given email
 */
export async function userExistsByEmail(email: string): Promise<{ exists: boolean; user?: any }> {
  try {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
      
    if (result.length === 0) {
      return { exists: false };
    }
    
    return { exists: true, user: result[0] };
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
}

/**
 * Check if a user is already a member of a workspace
 */
export async function isUserInWorkspace(userId: string, workspaceId: string): Promise<{ isMember: boolean; relationship?: any }> {
  try {
    const result = await db.select()
      .from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, workspaceId)
      ))
      .limit(1);
      
    if (result.length === 0) {
      return { isMember: false };
    }
    
    return { isMember: true, relationship: result[0] };
  } catch (error) {
    console.error('Error checking if user is in workspace:', error);
    throw error;
  }
}

/**
 * Add a user to a workspace
 */
export async function addUserToWorkspace(userId: string, workspaceId: string, role: WorkspaceRole): Promise<{ success: boolean; message: string; userWorkspace?: any }> {
  try {
    // Check if the user is already in the workspace
    const { isMember, relationship } = await isUserInWorkspace(userId, workspaceId);
    
    if (isMember) {
      return { success: false, message: 'User is already a member of this workspace', userWorkspace: relationship };
    }
    
    // Add the user to the workspace
    const result = await db.insert(userWorkspaces)
      .values({
        userId,
        workspaceId,
        role
      })
      .returning();
      
    if (!result || result.length === 0) {
      return { success: false, message: 'Failed to add user to workspace' };
    }
    
    return { success: true, message: 'User added to workspace successfully', userWorkspace: result[0] };
  } catch (error) {
    console.error('Error adding user to workspace:', error);
    throw error;
  }
}

/**
 * Check if a user has already been invited to a workspace
 */
export async function hasExistingInvite(email: string, workspaceId: string | null): Promise<{ hasInvite: boolean; invite?: any }> {
  try {
    // Make sure the userInvites table exists and is accessible
    try {
      let query = db.select()
        .from(userInvites)
        .where(and(
          eq(userInvites.email, email.toLowerCase()),
          eq(userInvites.status, 'Pending')
        ));

      // If workspaceId is provided, include it in the filter
      if (workspaceId) {
        query = query.where(and(
          eq(userInvites.email, email.toLowerCase()),
          eq(userInvites.workspaceId, workspaceId),
          eq(userInvites.status, 'Pending')
        ));
      }

      const result = await query.limit(1);
        
      if (result.length === 0) {
        return { hasInvite: false };
      }
      
      return { hasInvite: true, invite: result[0] };
    } catch (err) {
      console.warn('Error checking for existing invite - table may not exist yet:', err);
      return { hasInvite: false };
    }
  } catch (error) {
    console.error('Error checking for existing invite:', error);
    throw error;
  }
}

/**
 * Get workspace details by ID
 */
export async function getWorkspaceById(workspaceId: string): Promise<any | null> {
  try {
    const result = await db.select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
      
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error getting workspace by ID:', error);
    throw error;
  }
}

/**
 * Get user details by ID
 */
export async function getUserById(userId: string): Promise<any | null> {
  try {
    const result = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Create a workspace invitation and send an email
 */
export async function createInvitation({
  email,
  workspaceId,
  role,
  invitedById,
  isSuperAdmin = false
}: {
  email: string;
  workspaceId: string | null;
  role: WorkspaceRole;
  invitedById: string;
  isSuperAdmin?: boolean;
}): Promise<{ success: boolean; message: string; invite?: any; inviteLink?: string }> {
  try {
    const normalizedEmail = email.toLowerCase();
    
    // Step 1: Check if user already exists
    const { exists: userExists, user } = await userExistsByEmail(normalizedEmail);
    
    // If user exists and this is a Super Admin invite
    if (userExists && user && isSuperAdmin) {
      // Make the user a Super Admin
      await db.update(users)
        .set({ isGlobalSuperAdmin: true })
        .where(eq(users.id, user.id));
      
      return {
        success: true,
        message: 'User is now a Super Admin',
        invite: null
      };
    }
    
    // If user exists and this is a workspace invite, add them directly to the workspace
    if (userExists && user && workspaceId) {
      const { success, message, userWorkspace } = await addUserToWorkspace(user.id, workspaceId, role);
      
      return {
        success,
        message: success ? 'User added to workspace' : message,
        invite: userWorkspace
      };
    }
    
    // Step 2: Check for an existing invitation
    const { hasInvite, invite } = await hasExistingInvite(normalizedEmail, workspaceId);
    
    if (hasInvite && invite) {
      return {
        success: false,
        message: 'This email has already been invited',
        invite
      };
    }
    
    // Step 3: Generate a unique token for the invite
    const token = randomUUID();
    
    // Step 4: Create the invitation in the database
    try {
      // For Super Admin invites, we'll store null in the workspaceId
      // This indicates it's a global Super Admin invite, not tied to a specific workspace
      const newInvite = await db.insert(userInvites)
        .values({
          email: normalizedEmail,
          workspaceId,
          role,
          invitedById,
          token,
          status: 'Pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isSuperAdmin // Add this field to store if it's a Super Admin invite
        })
        .returning();
        
      if (!newInvite || newInvite.length === 0) {
        return { success: false, message: 'Failed to create invitation' };
      }
      
      // Step 5: Generate the invite link
      const baseUrl = env.BASE_URL || 'http://localhost:5173';
      const inviteLink = `${baseUrl}/signup?invite=${token}`;
      
      // Step 6: Get inviter details for the email
      const inviter = await getUserById(invitedById);
      
      if (!inviter) {
        return { 
          success: true, 
          message: 'Invitation created, but email could not be sent due to missing inviter details',
          invite: newInvite[0],
          inviteLink
        };
      }
      
      // Step 7: Send the invitation email
      let emailResult;
      
      if (isSuperAdmin) {
        // Send Super Admin invite email
        emailResult = await sendSuperAdminInviteEmail({
          email: normalizedEmail,
          inviterName: inviter.displayName || inviter.username,
          inviteLink
        });
      } else if (workspaceId) {
        // Send workspace invite email
        const workspace = await getWorkspaceById(workspaceId);
        
        if (!workspace) {
          return { 
            success: true, 
            message: 'Invitation created, but email could not be sent due to missing workspace details',
            invite: newInvite[0],
            inviteLink
          };
        }
        
        emailResult = await sendInviteEmail({
          email: normalizedEmail,
          workspaceName: workspace.name,
          inviterName: inviter.displayName || inviter.username,
          inviteLink
        });
      } else {
        return { 
          success: false, 
          message: 'Invalid invitation: must be either workspace or Super Admin invite' 
        };
      }
      
      return {
        success: true,
        message: emailResult.success 
          ? 'Invitation sent successfully' 
          : 'Invitation created, but email could not be sent',
        invite: newInvite[0],
        inviteLink
      };
    } catch (err) {
      console.error('Error creating invitation:', err);
      
      // Handle case where the table doesn't exist yet
      if (err instanceof Error && err.message && err.message.includes('user_invites')) {
        return { success: false, message: 'Invite system is not fully set up. Please run migrations first.' };
      }
      
      throw err;
    }
  } catch (error) {
    console.error('Error in invitation process:', error);
    throw error;
  }
}

/**
 * Get invite details by token
 */
export async function getInviteByToken(token: string): Promise<any | null> {
  try {
    const result = await db.select()
      .from(userInvites)
      .where(eq(userInvites.token, token))
      .limit(1);
      
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    console.error('Error getting invite by token:', error);
    return null;
  }
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(token: string, userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get the invitation
    const invite = await getInviteByToken(token);
    
    if (!invite) {
      return { success: false, message: 'Invitation not found' };
    }
    
    // Check if the invitation has expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { success: false, message: 'Invitation has expired' };
    }
    
    // Check if the invitation has already been accepted
    if (invite.status !== 'Pending') {
      return { success: false, message: `Invitation has already been ${invite.status.toLowerCase()}` };
    }
    
    // If this is a Super Admin invite, set the user as a global Super Admin
    if (invite.isSuperAdmin) {
      await db.update(users)
        .set({ isGlobalSuperAdmin: true })
        .where(eq(users.id, userId));
      
      // Update the invitation status
      await db.update(userInvites)
        .set({
          status: 'Accepted',
          acceptedAt: new Date()
        })
        .where(eq(userInvites.id, invite.id));
      
      return { success: true, message: 'You are now a Super Admin' };
    }
    
    // Regular workspace invitation
    if (!invite.workspaceId) {
      return { success: false, message: 'Invalid invitation: missing workspace' };
    }
    
    // Add the user to the workspace
    const { success, message } = await addUserToWorkspace(userId, invite.workspaceId, invite.role);
    
    if (!success) {
      return { success: false, message };
    }
    
    // Update the invitation status
    await db.update(userInvites)
      .set({
        status: 'Accepted',
        acceptedAt: new Date()
      })
      .where(eq(userInvites.id, invite.id));
    
    return { success: true, message: 'Invitation accepted successfully' };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
}

/**
 * List all pending invites for a workspace
 */
export async function listPendingInvites(workspaceId: string): Promise<any[]> {
  try {
    const result = await db.select()
      .from(userInvites)
      .leftJoin(users, eq(userInvites.invitedById, users.id))
      .where(and(
        eq(userInvites.workspaceId, workspaceId),
        eq(userInvites.status, 'Pending')
      ));
      
    return result.map(row => ({
      id: row.user_invites.id,
      email: row.user_invites.email,
      workspaceId: row.user_invites.workspaceId,
      role: row.user_invites.role,
      status: row.user_invites.status,
      token: row.user_invites.token,
      invitedAt: row.user_invites.invitedAt,
      expiresAt: row.user_invites.expiresAt,
      acceptedAt: row.user_invites.acceptedAt,
      isSuperAdmin: row.user_invites.isSuperAdmin,
      invitedBy: row.users ? {
        id: row.users.id,
        username: row.users.username,
        displayName: row.users.displayName,
        email: row.users.email,
        avatar: row.users.avatar
      } : null
    }));
  } catch (error) {
    console.error('Error listing pending invites:', error);
    return [];
  }
}

/**
 * List all pending Super Admin invites
 */
export async function listPendingSuperAdminInvites(): Promise<any[]> {
  try {
    const result = await db.select()
      .from(userInvites)
      .leftJoin(users, eq(userInvites.invitedById, users.id))
      .where(and(
        eq(userInvites.isSuperAdmin, true),
        eq(userInvites.status, 'Pending')
      ));
      
    return result.map(row => ({
      id: row.user_invites.id,
      email: row.user_invites.email,
      workspaceId: row.user_invites.workspaceId,
      role: row.user_invites.role,
      status: row.user_invites.status,
      token: row.user_invites.token,
      invitedAt: row.user_invites.invitedAt,
      expiresAt: row.user_invites.expiresAt,
      acceptedAt: row.user_invites.acceptedAt,
      isSuperAdmin: row.user_invites.isSuperAdmin,
      invitedBy: row.users ? {
        id: row.users.id,
        username: row.users.username,
        displayName: row.users.displayName,
        email: row.users.email,
        avatar: row.users.avatar
      } : null
    }));
  } catch (error) {
    console.error('Error listing pending Super Admin invites:', error);
    return [];
  }
}

/**
 * Cancel an invitation
 */
export async function cancelInvitation(inviteId: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await db.delete(userInvites)
      .where(eq(userInvites.id, inviteId))
      .returning();
      
    if (!result || result.length === 0) {
      return { success: false, message: 'Failed to cancel invitation' };
    }
    
    return { success: true, message: 'Invitation cancelled successfully' };
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    throw error;
  }
}

/**
 * Process all pending invitations for a user after they sign up
 */
export async function processPendingInvitations(email: string, userId: string): Promise<{ processed: number; errors: string[] }> {
  try {
    const normalizedEmail = email.toLowerCase();
    
    // Get all pending invitations for this email
    const pendingInvites = await db.select()
      .from(userInvites)
      .where(and(
        eq(userInvites.email, normalizedEmail),
        eq(userInvites.status, 'Pending')
      ));
    
    let processed = 0;
    const errors: string[] = [];
    
    for (const invite of pendingInvites) {
      try {
        // Check if invitation has expired
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          // Mark as expired
          await db.update(userInvites)
            .set({ status: 'Expired' })
            .where(eq(userInvites.id, invite.id));
          errors.push(`Invitation to ${invite.workspaceId ? 'workspace' : 'Super Admin'} has expired`);
          continue;
        }
        
        if (invite.isSuperAdmin) {
          // Make user a Super Admin
          await db.update(users)
            .set({ isGlobalSuperAdmin: true })
            .where(eq(users.id, userId));
            
          // Mark invitation as accepted
          await db.update(userInvites)
            .set({
              status: 'Accepted',
              acceptedAt: new Date()
            })
            .where(eq(userInvites.id, invite.id));
          
          processed++;
        } else if (invite.workspaceId) {
          // Add user to workspace
          const { success } = await addUserToWorkspace(userId, invite.workspaceId, invite.role);
          
          if (success) {
            // Mark invitation as accepted
            await db.update(userInvites)
              .set({
                status: 'Accepted',
                acceptedAt: new Date()
              })
              .where(eq(userInvites.id, invite.id));
            
            processed++;
          } else {
            errors.push(`Failed to add user to workspace ${invite.workspaceId}`);
          }
        }
      } catch (error) {
        console.error('Error processing invite:', error);
        errors.push(`Error processing invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return { processed, errors };
  } catch (error) {
    console.error('Error processing pending invitations:', error);
    throw error;
  }
}
