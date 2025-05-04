// src/lib/db/migrations/add-avatar-to-users.ts
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export async function addAvatarToUsers() {
  console.log('Running migration: Adding avatar column to users table');
  
  try {
    // Check if the column already exists to avoid errors
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatar'
    `);
    
    if (checkResult.rows && checkResult.rows.length > 0) {
      console.log('Avatar column already exists in users table');
      return;
    }
    
    // Add the avatar column to store the image data
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN avatar TEXT
    `);
    
    console.log('Successfully added avatar column to users table');
  } catch (error) {
    console.error('Error adding avatar column to users table:', error);
    throw error;
  }
}
