// src/hooks.server.ts
import { verify } from 'hono/jwt';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize user auth state
  event.locals.user = undefined;
  event.locals.token = undefined;

  // First check for JWT token in Authorization header
  let token;
  const authHeader = event.request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // Then check for token in cookies if not found in header
  if (!token) {
    token = event.cookies.get('auth_token');
  }
  
  if (token) {
    try {
      // Verify the JWT token
      const payload = await verify(token, env.JWT_SECRET);
      
      // Set user and token in locals
      event.locals.user = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        role: payload.role
      };
      event.locals.token = token;
    } catch (error) {
      // Invalid token, continue as unauthenticated
      console.error('Invalid JWT token:', error);
    }
  }

  // Continue with request
  return resolve(event);
}