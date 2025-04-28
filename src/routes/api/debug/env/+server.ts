// src/routes/api/debug/env/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// A route to check environment variables are properly set
// IMPORTANT: Only enable this in development or staging, never in production!
export const GET: RequestHandler = async () => {
  // Check if we're in development mode
  if (env.NODE_ENV !== 'development') {
    return json({
      success: false,
      message: 'Debug routes only available in development environment'
    }, { status: 403 });
  }
  
  // Return sanitized environment info
  return json({
    success: true,
    data: {
      NODE_ENV: env.NODE_ENV,
      DATABASE_CONFIGURED: !!env.DATABASE_URL,
      JWT_SECRET_CONFIGURED: !!env.JWT_SECRET,
      JWT_SECRET_LENGTH: env.JWT_SECRET?.length || 0,
      API_BASE_URL: env.API_BASE_URL || '/api',
    }
  });
};
