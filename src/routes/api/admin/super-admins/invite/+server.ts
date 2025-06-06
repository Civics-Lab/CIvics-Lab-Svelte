// src/routes/api/admin/super-admins/invite/+server.ts
import { json, error } from '@sveltejs/kit';
import { createInvitation, listPendingSuperAdminInvites } from '$lib/server/invites';
import { isGlobalSuperAdmin } from '$lib/server/auth';
import { logSuperAdminAction } from '$lib/middleware/superadmin/audit';
import type { RequestHandler } from './$types';

// GET /api/admin/super-admins/invite - Get all pending Super Admin invites
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'Forbidden - Requires Super Admin privileges');
    }
    
    // Get all pending Super Admin invites
    const invites = await listPendingSuperAdminInvites();
    
    // Log the action
    await logSuperAdminAction({
      userId: user.id,
      action: 'LIST_SUPER_ADMIN_INVITES',
      details: { count: invites.length }
    });
    
    return json({
      success: true,
      data: invites
    });
  } catch (err) {
    console.error('Error fetching Super Admin invites:', err);
    throw error(500, 'Internal server error');
  }
};

// POST /api/admin/super-admins/invite - Send a Super Admin invitation
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check if the user is a Super Admin
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'Forbidden - Requires Super Admin privileges');
    }
    
    const { email } = await request.json();
    
    if (!email) {
      throw error(400, 'Email is required');
    }
    
    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw error(400, 'Invalid email address');
    }
    
    // Use the invitation service to create the Super Admin invite
    const result = await createInvitation({
      email,
      workspaceId: null, // Super Admin invites don't have a workspace
      role: 'Super Admin',
      invitedById: user.id,
      isSuperAdmin: true
    });
    
    if (!result.success) {
      return json({
        success: false,
        error: result.message
      }, { status: 400 });
    }
    
    // Log the action
    await logSuperAdminAction({
      userId: user.id,
      action: 'SEND_SUPER_ADMIN_INVITE',
      details: {
        targetEmail: email,
        inviteId: result.invite?.id
      }
    });
    
    return json({
      success: true,
      message: result.message,
      invite: result.invite,
      inviteLink: result.inviteLink
    });
  } catch (err) {
    console.error('Error creating Super Admin invite:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    const statusCode = err instanceof Error && 'status' in err ? (err as any).status : 500;
    
    return json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
};
