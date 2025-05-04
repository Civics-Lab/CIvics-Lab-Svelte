// src/routes/api/auth/update-email/+server.ts
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
    
    // Get the email from the request body
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    // Check if the email is the same as the current user's email
    if (tokenPayload.email === email) {
      return json({ 
        success: true, 
        message: 'No change needed - email is the same'
      });
    }
    
    // Check if the email is already used by another user
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    
    if (existingUser.length > 0) {
      return json({ 
        success: false, 
        error: 'Email is already in use' 
      }, { status: 400 });
    }
    
    // In a real implementation, you would:
    // 1. Generate a verification token
    // 2. Store the pending email change in a separate table
    // 3. Send a verification email to the new address
    // 4. Only update the email once verified
    
    // For now, simulate sending a verification email and directly update the email
    try {
      const [updatedUser] = await db.update(users)
        .set({ email })
        .where(eq(users.id, tokenPayload.id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          displayName: users.displayName,
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
      
      // In production, you would send a verification email here
      console.log(`[MOCK] Sending verification email to ${email}`);
      
      // Return success response
      return json({ 
        success: true, 
        message: 'Verification email sent. Please check your inbox.',
        user: updatedUser,
        token: newToken
      });
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return json({ 
        success: false, 
        error: 'Failed to update email'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Update email error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}