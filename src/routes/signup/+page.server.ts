// src/routes/signup/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession()

  // if the user is already logged in redirect them
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
    const confirmPassword = formData.get('confirmPassword') as string
    
    // Form validation
    const errors: Record<string, string> = {};
    
    // Validate email
    const validEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,8}$/.test(email)
    if (!validEmail) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password match
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Return errors if any
    if (Object.keys(errors).length > 0) {
      return fail(400, { 
        errors, 
        email, 
        success: false 
      });
    }

    // Create user account
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Optional: You can set additional user metadata here
        // data: { full_name: fullName }
      }
    })

    if (error) {
      return fail(400, {
        success: false,
        email,
        message: error.message || 'Failed to create account. Please try again.',
      })
    }

    // On successful signup
    return {
      success: true,
      message: 'Account created successfully! Please check your email to confirm your account.',
    }
  },
}