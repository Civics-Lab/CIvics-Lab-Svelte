// src/routes/api/auth/change-password/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { authService } from '../service';
import bcrypt from 'bcryptjs';

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
    
    // Get the passwords from the request body
    const body = await request.json();
    const { current_password, new_password } = body;
    
    if (!current_password || !new_password) {
      return json({ 
        success: false, 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }
    
    // Validate password length
    if (new_password.length < 6) {
      return json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }
    
    // Get the user from the database to verify current password
    const userResult = await db.select()
      .from(users)
      .where(eq(users.id, tokenPayload.id));
    
    if (userResult.length === 0) {
      return json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    const user = userResult[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, user.passwordHash);
    
    if (!isPasswordValid) {
      return json({ 
        success: false, 
        error: 'Current password is incorrect' 
      }, { status: 400 });
    }
    
    // Hash the new password
    const passwordHash = await bcrypt.hash(new_password, 10);
    
    // Update the password in the database
    try {
      await db.update(users)
        .set({ passwordHash })
        .where(eq(users.id, tokenPayload.id));
      
      return json({ 
        success: true, 
        message: 'Password updated successfully'
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return json({ 
        success: false, 
        error: 'Failed to update password'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Change password error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}