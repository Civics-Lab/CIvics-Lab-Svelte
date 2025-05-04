// src/routes/api/auth/update-profile/+server.ts
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
    
    // Get the update data from the request body
    const body = await request.json();
    const updates: Record<string, any> = {};
    
    // Handle username update
    if (body.username && body.username !== tokenPayload.username) {
      // Check if the username is already taken
      const existingUser = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.username, body.username));
      
      if (existingUser.length > 0) {
        return json({ 
          success: false, 
          error: 'Username is already taken' 
        }, { status: 400 });
      }
      
      updates.username = body.username;
    }
    
    // Handle displayName update
    if (body.displayName) {
      updates.displayName = body.displayName;
    }
    
    // Handle avatar update (including removal)
    if (body.hasOwnProperty('avatar')) {
      updates.avatar = body.avatar; // Can be null to remove the avatar
    }
    
    // If no updates, return early
    if (Object.keys(updates).length === 0) {
      return json({ 
        success: true, 
        message: 'No changes made',
        user: tokenPayload
      });
    }
    
    // Update the user in the database
    try {
      const [updatedUser] = await db.update(users)
        .set(updates)
        .where(eq(users.id, tokenPayload.id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          displayName: users.displayName,
          avatar: users.avatar,
          role: users.role
        });
      
      if (!updatedUser) {
        return json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }
      
      // Generate a new token with the updated information
      const newToken = await authService.generateToken({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      });
      
      // Return the updated user data and new token
      return json({ 
        success: true, 
        user: updatedUser,
        token: newToken
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return json({ 
        success: false, 
        error: 'Failed to update user profile'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}