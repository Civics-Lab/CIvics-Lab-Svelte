// src/routes/app/admin/+layout.server.ts
import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    redirect(303, '/login');
  }

  // You could add additional checks for admin privileges here
  // For example, checking if user.role includes admin permissions
  
  return { 
    session: { active: true },
    user 
  };
}
