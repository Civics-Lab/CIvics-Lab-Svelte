// src/routes/engage/settings/workspace/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    redirect(303, '/login');
  }
  
  return { 
    user
  };
};