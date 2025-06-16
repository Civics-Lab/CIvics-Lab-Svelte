// src/routes/app/businesses/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
  depends('app:businesses');
  
  // The parent layout already handles authentication and workspace access
  // We just need to pass through the necessary data for the page
  return {
    user: locals.user,
    workspace: locals.currentWorkspace
  };
};
