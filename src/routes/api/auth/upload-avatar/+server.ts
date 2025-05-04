// src/routes/api/auth/upload-avatar/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
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
    
    // Get the form data with the avatar image
    const formData = await request.formData();
    const avatarFile = formData.get('avatar');
    
    if (!avatarFile || !(avatarFile instanceof File)) {
      return json({ 
        success: false, 
        error: 'No avatar file provided or invalid format' 
      }, { status: 400 });
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(avatarFile.type)) {
      return json({ 
        success: false, 
        error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are supported.' 
      }, { status: 400 });
    }
    
    // Validate file size (limit to 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (avatarFile.size > maxSize) {
      return json({ 
        success: false, 
        error: 'File size exceeds the 2MB limit.' 
      }, { status: 400 });
    }
    
    // Read the file as a base64-encoded string
    try {
      const buffer = await avatarFile.arrayBuffer();
      
      // Convert to Base64
      const uint8Array = new Uint8Array(buffer);
      const base64Image = Buffer.from(uint8Array).toString('base64');
      const avatarData = `data:${avatarFile.type};base64,${base64Image}`;
      
      console.log('Successfully encoded image to base64, length:', avatarData.length);
      
      // Update the user record in the database
      try {
        console.log('Attempting to update user with ID:', tokenPayload.id);
        console.log('Avatar data length:', avatarData.length);
        
        // First, check if the avatar column exists
        try {
          const checkResult = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'avatar'
          `);
          
          console.log('Avatar column check result:', checkResult.rows?.length);
          
          if (!checkResult.rows || checkResult.rows.length === 0) {
            console.log('Avatar column does not exist in users table, adding it');
            await db.execute(sql`
              ALTER TABLE users 
              ADD COLUMN avatar TEXT
            `);
            console.log('Avatar column added to users table');
          }
        } catch (columnCheckError) {
          console.error('Error checking avatar column:', columnCheckError);
        }
        
        const [updatedUser] = await db.update(users)
          .set({ 
            avatar: avatarData,
            updatedAt: new Date() 
          })
          .where(eq(users.id, tokenPayload.id))
          .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            displayName: users.displayName,
            avatar: users.avatar,
            role: users.role
          });
        
        console.log('User update result:', updatedUser ? 'Success' : 'No user found');
        
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
        
        // Return success response
        return json({ 
          success: true, 
          message: 'Avatar uploaded successfully',
          user: updatedUser,
          token: newToken
        });
      } catch (dbError) {
        console.error('Database error when uploading avatar:', dbError);
        console.error('Error details:', dbError instanceof Error ? dbError.message : 'Unknown error');
        console.error('Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');
        return json({ 
          success: false, 
          error: 'Failed to update user avatar in database'
        }, { status: 500 });
      }
    } catch (fileError) {
      console.error('Error processing image file:', fileError);
      return json({ 
        success: false, 
        error: 'Failed to process image file'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Avatar upload error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
