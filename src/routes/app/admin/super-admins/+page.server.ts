import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { isGlobalSuperAdmin } from '$lib/server/auth';
import { v4 as uuidv4 } from 'uuid';
import { createInvitation } from '$lib/server/invites';
import type { PageServerLoad, Actions } from './$types';

/**
 * Load data for the Super Admins management page
 */
export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  // Check if the user is logged in
  if (!user) {
    throw redirect(302, '/login');
  }
  
  // Check if the user is a Super Admin
  try {
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'You do not have permission to access this page');
    }
    
    // Get all users with Super Admin status
    const superAdmins = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatar: users.avatar,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.isGlobalSuperAdmin, true));
    
    // Get all other users for potential promotion
    const otherUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        avatar: users.avatar
      })
      .from(users)
      .where(eq(users.isGlobalSuperAdmin, false));
    
    return {
      superAdmins,
      otherUsers
    };
  } catch (err) {
    console.error('Error loading Super Admins page:', err);
    
    // Check if the error is due to missing is_global_super_admin column
    if (err instanceof Error && 
        err.message && 
        err.message.includes('is_global_super_admin')) {
      return {
        needsMigration: true,
        error: 'Database migration required. Please run the Super Admin migration.'
      };
    }
    
    throw error(500, 'Error loading Super Admins data');
  }
};

/**
 * Actions for managing Super Admins
 */
export const actions: Actions = {
  /**
   * Add a user as a global Super Admin
   */
  addSuperAdmin: async ({ request, locals }) => {
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the current user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'You do not have permission to add Super Admins');
    }
    
    const formData = await request.formData();
    const userId = formData.get('userId')?.toString();
    
    if (!userId) {
      return { success: false, message: 'User ID is required' };
    }
    
    try {
      // Update the user to be a Super Admin
      await db
        .update(users)
        .set({ isGlobalSuperAdmin: true })
        .where(eq(users.id, userId));
      
      return {
        success: true,
        message: 'User has been granted Super Admin privileges'
      };
    } catch (err) {
      console.error('Error adding Super Admin:', err);
      return {
        success: false,
        message: 'Error adding Super Admin'
      };
    }
  },
  
  /**
   * Remove Super Admin privileges from a user
   */
  removeSuperAdmin: async ({ request, locals }) => {
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the current user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'You do not have permission to remove Super Admins');
    }
    
    const formData = await request.formData();
    const userId = formData.get('userId')?.toString();
    
    if (!userId) {
      return { success: false, message: 'User ID is required' };
    }
    
    // Prevent removing your own Super Admin privileges
    if (userId === user.id) {
      return {
        success: false,
        message: 'You cannot remove your own Super Admin privileges'
      };
    }
    
    try {
      // Update the user to remove Super Admin privileges
      await db
        .update(users)
        .set({ isGlobalSuperAdmin: false })
        .where(eq(users.id, userId));
      
      return {
        success: true,
        message: 'Super Admin privileges have been removed'
      };
    } catch (err) {
      console.error('Error removing Super Admin:', err);
      return {
        success: false,
        message: 'Error removing Super Admin privileges'
      };
    }
  },
  
  /**
   * Invite a new user as a Super Admin
   */
  inviteSuperAdmin: async ({ request, locals }) => {
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the current user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'You do not have permission to invite Super Admins');
    }
    
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    
    if (!email) {
      return { success: false, message: 'Email address is required' };
    }
    
    try {
      // Check if the user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      if (existingUser.length > 0) {
        // If user exists, make them a Super Admin directly
        await db
          .update(users)
          .set({ isGlobalSuperAdmin: true })
          .where(eq(users.id, existingUser[0].id));
        
        return {
          success: true,
          message: `${email} already exists and has been granted Super Admin privileges`
        };
      }
      
      // Create a special invite for a Super Admin
      // Note: You may need to adjust this based on your invitation system
      const inviteResult = await createInvitation({
        email: email.toLowerCase(),
        workspaceId: null, // Super Admin doesn't need a specific workspace
        role: 'Super Admin', 
        invitedById: user.id,
        isSuperAdmin: true // Add this flag to your invitation system
      });
      
      if (!inviteResult.success) {
        return { 
          success: false, 
          message: inviteResult.message || 'Failed to create invitation'
        };
      }
      
      return {
        success: true,
        message: `Invitation sent to ${email} with Super Admin privileges`
      };
    } catch (err) {
      console.error('Error inviting Super Admin:', err);
      return {
        success: false,
        message: 'Error inviting Super Admin'
      };
    }
  }
};
