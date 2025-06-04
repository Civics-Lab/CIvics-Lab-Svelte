import { json, error } from '@sveltejs/kit';
import { isGlobalSuperAdmin } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/admin/access - Check if the user has admin access
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
    
    // If we get here, the user is a Super Admin
    return json({ 
      hasAccess: true,
      isGlobalSuperAdmin: true
    });
  } catch (err) {
    if (err instanceof Response) {
      throw err;
    }
    
    // For other errors, return a 403
    console.error('Error checking admin access:', err);
    throw error(403, 'Forbidden - Admin access check failed');
  }
};
