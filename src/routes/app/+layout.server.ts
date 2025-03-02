// src/routes/app/+layout.server.ts
import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

// This protects all routes under /app/*
export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession()

  if (!session) {
    redirect(303, '/login')
  }

  return { session, user }
}