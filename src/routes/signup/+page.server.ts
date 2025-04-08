// src/routes/signup/+page.server.ts
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // if the user is already logged in redirect them
  if (locals.user) {
    redirect(303, '/app')
  }

  return {}
}
