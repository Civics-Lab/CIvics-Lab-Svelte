// src/routes/api/auth/validate/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authService } from '../service';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Also check cookies as fallback
    const cookieToken = cookies.get('auth_token');
    
    let token = null;
    let tokenSource = '';
    
    // Prioritize header, fall back to cookie
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenSource = 'header';
    } else if (cookieToken) {
      token = cookieToken;
      tokenSource = 'cookie';
    }
    
    if (!token) {
      console.log('No token provided for validation');
      return json({
        success: false,
        error: 'No token provided'
      }, { status: 401 });
    }
    
    console.log(`Validating token from ${tokenSource}`);
    const payload = await authService.validateToken(token);
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    const timeToExpire = payload.exp - now;
    const isExpired = timeToExpire <= 0;
    const expiresIn = isExpired ? 'expired' : `${Math.floor(timeToExpire / 60 / 60)} hours`;
    
    if (isExpired) {
      return json({
        success: false,
        error: 'Token expired',
        data: {
          expired: true,
          username: payload.username,
          expiresIn
        }
      }, { status: 401 });
    }

    return json({
      success: true,
      data: {
        valid: true,
        userId: payload.id,
        username: payload.username,
        expiresIn,
        timeToExpire
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid token',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 401 });
  }
};
