import { error, redirect } from '@sveltejs/kit';
import { isGlobalSuperAdmin } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

/**
 * Server-side layout load function to ensure only Super Admins can access this section
 * This protects all routes under /settings/admin/
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  // Check if the user is logged in
  if (!user) {
    throw redirect(302, '/login');
  }
  
  // Check if the user is a Super Admin
  try {
    const isSuperAdmin = await isGlobalSuperAdmin(user.id);
    
    if (!isSuperAdmin) {
      throw error(403, 'You do not have permission to access the Admin section');
    }
    
    // Return nothing, just allow access
    return {};
  } catch (err) {
    console.error('Error checking Super Admin access:', err);
    throw error(500, 'Error checking access permissions');
  }
};
