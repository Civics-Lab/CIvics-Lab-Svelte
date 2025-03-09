// src/routes/engage/settings/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession();

  if (!session) {
    redirect(303, '/login');
  }

  return { session, user };
};