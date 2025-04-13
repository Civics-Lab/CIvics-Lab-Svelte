// src/routes/api/auth/login/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '../service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, password } = await request.json();
    
    console.log(`API Login endpoint called with username: ${username}`);
    
    // Validate input
    if (!username || !password) {
      console.log('Missing username or password');
      return json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }
    
    // Attempt login
    console.log('Calling auth service login method');
    const result = await authService.login({ username, password });
    console.log('Login successful, preparing response');
    
    // Ensure we're returning a valid JSON response
    const response = {
      success: true,
      data: {
        token: result.token,
        user: result.user
      }
    };
    
    // Debug the response
    console.log('Returning response:', JSON.stringify(response));
    
    return json(response);
  } catch (error) {
    const statusCode = error instanceof Error && 
      error.message === 'Invalid credentials' ? 401 : 500;
    
    console.error('Login error:', error);
    
    // Return detailed error for debugging
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }, { status: statusCode });
  }
};
