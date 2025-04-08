// src/routes/api/auth/validate/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '../service';

export const POST: RequestHandler = async ({ request }) => {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({
      success: false,
      error: 'No token provided'
    }, { status: 401 });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await authService.validateToken(token);
    
    return json({
      success: true,
      data: {
        valid: true,
        user: {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role
        }
      }
    });
  } catch (error) {
    return json({
      success: false,
      error: 'Invalid token',
      data: {
        valid: false
      }
    }, { status: 401 });
  }
};
