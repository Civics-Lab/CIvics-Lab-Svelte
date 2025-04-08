// src/routes/engage/+page.server.ts
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user

  if (!user) {
    redirect(303, '/login')
  }

  return { 
    session: { active: true },
    user 
  }
}