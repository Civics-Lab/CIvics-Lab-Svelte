// src/routes/api/auth/signup/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '../service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, username, password, displayName, inviteToken } = await request.json();
    
    // Validate input
    if (!email || !username || !password) {
      return json({
        success: false,
        error: 'Email, username, and password are required'
      }, { status: 400 });
    }
    
    // Attempt signup
    const result = await authService.signup({ 
      email, 
      username, 
      password, 
      displayName, 
      inviteToken 
    });
    
    return json({
      success: true,
      data: result
    });
  } catch (error) {
    const statusCode = error instanceof Error && 
      error.message === 'Username or email already exists' ? 409 : 500;
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: statusCode });
  }
};
