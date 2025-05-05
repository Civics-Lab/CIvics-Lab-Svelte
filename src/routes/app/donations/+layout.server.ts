// src/routes/app/donations/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import { requireServiceAccess, SERVICES } from '$lib/utils/serviceGuard';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Check if user is authenticated - this should be redundant as parent layout already checks
  const user = locals.user;
  
  if (!user) {
    throw redirect(303, '/login');
  }
  
  // Get the current workspace from locals
  const workspace = locals.currentWorkspace;
  
  if (!workspace) {
    throw redirect(303, '/app?error=no-workspace');
  }
  
  // Check if the workspace has access to the Engage service
  requireServiceAccess(workspace, SERVICES.ENGAGE, '/app?error=service-not-available');
  
  // If we get here, the workspace has access to Engage
  return {
    user,
    workspace
  };
};