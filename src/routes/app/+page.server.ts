// src/routes/app/+page.server.ts
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, cookies }) => {
  console.log('Loading app page, checking authentication');
  
  // Check for user in locals (set by hooks.server.ts)
  const user = locals.user;
  console.log('User from locals:', user ? 'authenticated' : 'not authenticated');
  
  // Double-check auth token in cookies as fallback
  const authToken = cookies.get('auth_token');
  console.log('Auth token in cookies:', authToken ? 'present' : 'not present');
  
  if (!user) {
    console.log('User not authenticated, redirecting to login page');
    redirect(303, '/login');
  }
  
  console.log('User authenticated, loading app page for:', user.username);
  
  return { 
    session: { active: true },
    user 
  }
}