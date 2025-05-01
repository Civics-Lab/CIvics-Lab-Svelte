// src/routes/engage/settings/workspace/people/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db, userWorkspaces, users, workspaces, userInvites } from '$lib/db/drizzle';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';

export const load: PageServerLoad = async ({ locals, url, cookies, request }) => {
  // Ensure user is authenticated
  if (!locals.user) {
    redirect(303, '/login');
  }

  // Get the current workspace ID from locals
  const workspaceId = locals.currentWorkspace?.id;
  
  if (!workspaceId) {
    console.error('No workspace ID found in server component, checking query parameter');
    
    // Get workspace ID from the URL query parameter as fallback
    const urlWorkspaceId = url.searchParams.get('workspace');
    
    if (urlWorkspaceId) {
      console.log(`Using workspace ID from URL: ${urlWorkspaceId}`);
      // Set it in locals for future requests
      locals.currentWorkspace = { id: urlWorkspaceId } as any;
      // Continue with this workspace ID
      return load({ locals: { ...locals, currentWorkspace: { id: urlWorkspaceId } }, url, cookies, request });
    }
    
    // Return an empty state that the client will handle
    return {
      members: [],
      pendingInvites: [],
      workspace: null,
      workspaceRoles: ['Super Admin', 'Admin', 'Basic User', 'Volunteer'],
      noWorkspaceSelected: true
    };
  }
  
  try {
    console.log(`Loading workspace members for workspace ID: ${workspaceId}`);
    
    // Check if the user has permission to access this workspace
    const userWorkspace = await db.query.userWorkspaces.findFirst({
      where: and(
        eq(userWorkspaces.userId, locals.user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      )
    });
    
    if (!userWorkspace) {
      console.error(`User ${locals.user.id} does not have access to workspace ${workspaceId}`);
      return {
        members: [],
        pendingInvites: [],
        workspace: null,
        workspaceRoles: ['Super Admin', 'Admin', 'Basic User', 'Volunteer'],
        noWorkspaceAccess: true
      };
    }
    
    // Get workspace members
    const members = await db.query.userWorkspaces.findMany({
      where: eq(userWorkspaces.workspaceId, workspaceId),
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
    
    console.log(`Found ${members.length} members for workspace ${workspaceId}`);
    
    // Initialize pendingInvites as an empty array
    let pendingInvites = [];
    let tableNotReady = false;
    
    // Get pending invites for this workspace
    pendingInvites = await db.query.userInvites.findMany({
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
    
    console.log(`Found ${pendingInvites.length} pending invites for workspace ${workspaceId}`);
    
    // Lookup workspace name for the breadcrumb
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      columns: {
        id: true,
        name: true
      }
    });
    
    return {
      members,
      pendingInvites,
      workspace,
      workspaceRoles: ['Super Admin', 'Admin', 'Basic User', 'Volunteer']
    };
  } catch (err) {
    console.error('Error loading workspace people:', err);
    
    // Return basic error data
    return {
      members: [],
      pendingInvites: [],
      workspace: null,
      workspaceRoles: ['Super Admin', 'Admin', 'Basic User', 'Volunteer'],
      error: 'Could not load workspace members'
    };
    
    throw error(500, 'Failed to load workspace members');
  }
};

export const actions: Actions = {
  inviteUser: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'You must be logged in to invite users');
    }
    
    const workspaceId = locals.currentWorkspace?.id;
    
    if (!workspaceId) {
      throw error(400, 'No workspace selected');
    }
    
    // Parse form data
    const formData = await request.formData();
    const email = formData.get('email')?.toString().toLowerCase();
    const role = formData.get('role')?.toString();
    
    if (!email || !role) {
      throw error(400, 'Email and role are required');
    }
    
    try {
      try {
        // Check if the email has already been invited
        const existingInvite = await db.query.userInvites.findFirst({
          where: and(
            eq(userInvites.email, email),
            eq(userInvites.workspaceId, workspaceId),
            eq(userInvites.status, 'Pending')
          )
        });
        
        if (existingInvite) {
          throw error(400, 'This email has already been invited to this workspace');
        }
      } catch (err) {
        // If the error is about the user_invites table, continue with adding the user
        // but we won't be able to create an invite
        if (err.message && err.message.includes('user_invites')) {
          throw error(500, 'The invite system is not fully set up yet. Please run database migrations first.');
        }
        throw err;
      }
      
      // Check if the user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
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
        
        return {
          success: true,
          message: 'User added to workspace',
          userAdded: true
        };
      }
      
      try {
        // Generate a token for the invite link
        const token = randomUUID();
        
        // Store the invitation
        await db.insert(userInvites).values({
          email,
          workspaceId,
          role,
          invitedById: locals.user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });
        
        // In a real application, you would send an email here
        // For now, we'll just return the invite link
        const baseUrl = env.BASE_URL || 'http://localhost:5173';
        const inviteLink = `${baseUrl}/signup?invite=${token}`;
        
        return {
          success: true,
          message: 'Invitation sent',
          inviteLink
        };
      } catch (err) {
        if (err.message && err.message.includes('user_invites')) {
          throw error(500, 'The invite system is not fully set up yet. Please run database migrations first.');
        }
        throw err;
      }
    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        throw err;
      }
      console.error('Error inviting user:', err);
      throw error(500, err instanceof Error ? err.message : 'Failed to send invitation');
    }
  },
  
  removeUser: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'You must be logged in to remove users');
    }
    
    const workspaceId = locals.currentWorkspace?.id;
    
    if (!workspaceId) {
      throw error(400, 'No workspace selected');
    }
    
    try {
      // Parse form data
      const formData = await request.formData();
      const userId = formData.get('userId')?.toString();
      
      if (!userId) {
        throw error(400, 'User ID is required');
      }
      
      // Don't allow removing self
      if (userId === locals.user.id) {
        throw error(400, 'You cannot remove yourself from the workspace');
      }
      
      // Get the user's workspace relationship
      const userWorkspace = await db.query.userWorkspaces.findFirst({
        where: and(
          eq(userWorkspaces.userId, userId),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      });
      
      if (!userWorkspace) {
        throw error(404, 'User not found in this workspace');
      }
      
      // Delete the relationship
      await db.delete(userWorkspaces)
        .where(eq(userWorkspaces.id, userWorkspace.id));
      
      return {
        success: true,
        message: 'User removed from workspace'
      };
    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        throw err;
      }
      console.error('Error removing user:', err);
      throw error(500, err instanceof Error ? err.message : 'Failed to remove user');
    }
  },
  
  cancelInvite: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'You must be logged in to cancel invites');
    }
    
    const workspaceId = locals.currentWorkspace?.id;
    
    if (!workspaceId) {
      throw error(400, 'No workspace selected');
    }
    
    try {
      // Parse form data
      const formData = await request.formData();
      const inviteId = formData.get('inviteId')?.toString();
      
      if (!inviteId) {
        throw error(400, 'Invite ID is required');
      }
      
      try {
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
        
        return {
          success: true,
          message: 'Invitation cancelled'
        };
      } catch (err) {
        if (err.message && err.message.includes('user_invites')) {
          throw error(500, 'The invite system is not fully set up yet. Please run database migrations first.');
        }
        throw err;
      }
    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        throw err;
      }
      console.error('Error cancelling invite:', err);
      throw error(500, err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  },
  
  updateRole: async ({ request, locals }) => {
    if (!locals.user) {
      throw error(401, 'You must be logged in to update roles');
    }
    
    const workspaceId = locals.currentWorkspace?.id;
    
    if (!workspaceId) {
      throw error(400, 'No workspace selected');
    }
    
    try {
      // Parse form data
      const formData = await request.formData();
      const userWorkspaceId = formData.get('userWorkspaceId')?.toString();
      const role = formData.get('role')?.toString();
      
      if (!userWorkspaceId || !role) {
        throw error(400, 'User workspace ID and role are required');
      }
      
      // Get the user workspace relationship
      const relationship = await db.query.userWorkspaces.findFirst({
        where: and(
          eq(userWorkspaces.id, userWorkspaceId),
          eq(userWorkspaces.workspaceId, workspaceId)
        ),
        with: {
          user: {
            columns: {
              id: true
            }
          }
        }
      });
      
      if (!relationship) {
        throw error(404, 'User not found in this workspace');
      }
      
      // Don't allow super admins to downgrade themselves
      if (relationship.user.id === locals.user.id && relationship.role === 'Super Admin' && role !== 'Super Admin') {
        throw error(400, 'You cannot downgrade your own Super Admin role');
      }
      
      // Update the role
      await db.update(userWorkspaces)
        .set({ role })
        .where(eq(userWorkspaces.id, userWorkspaceId));
      
      return {
        success: true,
        message: 'Role updated'
      };
    } catch (err) {
      if (err instanceof Error && 'status' in err) {
        throw err;
      }
      console.error('Error updating role:', err);
      throw error(500, err instanceof Error ? err.message : 'Failed to update role');
    }
  }
};
