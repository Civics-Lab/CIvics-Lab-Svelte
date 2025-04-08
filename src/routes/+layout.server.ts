// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  // Get user from locals (set in hooks.server.ts)
  const user = locals.user || null;
  const token = locals.token || null;

  return {
    session: token ? { active: true } : null,
    user,
    cookies: cookies.getAll(),
  }
}