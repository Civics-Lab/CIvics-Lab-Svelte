// src/routes/api/auth/login/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '../service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, password } = await request.json();
    
    // Validate input
    if (!username || !password) {
      return json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 });
    }
    
    // Attempt login
    const result = await authService.login({ username, password });
    
    return json({
      success: true,
      data: result
    });
  } catch (error) {
    const statusCode = error instanceof Error && 
      error.message === 'Invalid credentials' ? 401 : 500;
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: statusCode });
  }
};
