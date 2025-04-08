// src/routes/api/auth/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return json({
    success: true,
    message: 'Auth API',
    endpoints: [
      {
        path: '/api/auth/login',
        method: 'POST',
        description: 'Log in a user with username and password'
      },
      {
        path: '/api/auth/signup',
        method: 'POST',
        description: 'Register a new user'
      },
      {
        path: '/api/auth/validate',
        method: 'POST',
        description: 'Validate a JWT token'
      }
    ]
  });
};
