// src/routes/api/debug/db/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { count } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// A route to check database connectivity
// IMPORTANT: Only enable this in development or staging, never in production!
export const GET: RequestHandler = async () => {
  // Check if we're in development mode
  if (env.NODE_ENV !== 'development') {
    return json({
      success: false,
      message: 'Debug routes only available in development environment'
    }, { status: 403 });
  }
  
  try {
    // Test a simple database query
    const userCount = await db.select({ count: count() }).from(users);
    
    return json({
      success: true,
      data: {
        connected: true,
        userCount: userCount[0].count,
        databaseUrl: env.DATABASE_URL ? 
          env.DATABASE_URL.replace(/\/\/(.+?):.+?@/, '//***:***@') : // Hide credentials
          'Not configured'
      }
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
