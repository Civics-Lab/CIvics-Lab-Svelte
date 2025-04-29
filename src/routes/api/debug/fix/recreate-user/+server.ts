// src/routes/api/debug/fix/recreate-user/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import bcrypt from 'bcryptjs';
import type { RequestHandler } from './$types';

// A tool to recreate a user record that may have been lost
// IMPORTANT: Only enable this in development mode, never in production!
export const POST: RequestHandler = async ({ request }) => {
  // Check if we're in development mode
  if (env.NODE_ENV !== 'development') {
    return json({
      success: false,
      message: 'Debug routes only available in development environment'
    }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { id, email, username, displayName, password } = body;
    
    if (!id || !email || !username || !password) {
      return json({
        success: false,
        message: 'Missing required fields (id, email, username, password)'
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(db.sql`${users.id} = ${id}`);
    
    if (existingUser.length > 0) {
      return json({
        success: false,
        message: `User with ID ${id} already exists`
      }, { status: 409 });
    }
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the user with the specified ID
    const result = await db.execute(db.sql`
      INSERT INTO users (id, email, username, password_hash, display_name, created_at, updated_at, last_login_at, is_active, role)
      VALUES (
        ${id}, 
        ${email}, 
        ${username}, 
        ${passwordHash}, 
        ${displayName || username}, 
        NOW(), 
        NOW(), 
        NOW(), 
        true, 
        'user'
      )
    `);
    
    return json({
      success: true,
      message: `User ${username} recreated with ID ${id}`,
      results: result
    });
  } catch (error) {
    console.error('User recreation failed:', error);
    
    return json({
      success: false,
      error: 'Failed to recreate user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
};
