// src/routes/api/auth/check-username/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { authService } from '../service';

export async function POST({ request, cookies }) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Validate token
    let tokenPayload;
    try {
      tokenPayload = await authService.validateToken(token);
    } catch (error) {
      console.error('Token validation error:', error);
      return json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    
    // Get the username from the request body
    const body = await request.json();
    const { username } = body;
    
    if (!username) {
      return json({ success: false, error: 'Username is required' }, { status: 400 });
    }
    
    // Check if the username is the same as the current user's username
    if (tokenPayload.username === username) {
      return json({ success: true, available: true });
    }
    
    // Check if the username already exists in the database
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    
    const available = existingUser.length === 0;
    
    return json({ success: true, available });
  } catch (error) {
    console.error('Check username error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}