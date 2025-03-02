// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()

  // if the user is already logged in return them to the app page
  if (session) {
    redirect(303, '/app')
  }

  return { url: url.origin }
}

export const actions: Actions = {
  default: async (event) => {
    const {
      url,
      request,
      locals: { supabase },
    } = event
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    // Validate email
    const validEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,8}$/.test(email)
    if (!validEmail) {
      return fail(400, { 
        errors: { email: 'Please enter a valid email address' }, 
        email, 
        success: false 
      })
    }

    // Validate password (minimum validation)
    if (!password || password.length < 6) {
      return fail(400, { 
        errors: { password: 'Password must be at least 6 characters' }, 
        email, 
        success: false 
      })
    }

    // Sign in with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return fail(400, {
        success: false,
        email,
        message: error.message || 'Failed to sign in. Please check your credentials.',
      })
    }

    // This is a crucial difference - this redirect needs to be after the authentication
    // process completes successfully, not in the middle of the process
    throw redirect(303, '/app')
  },
}