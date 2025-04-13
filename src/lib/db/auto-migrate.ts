/**
 * Runtime migration helper to ensure necessary columns exist
 */
import { db } from './drizzle';
import { sql } from 'drizzle-orm';
import { fixSchemaIssues } from './schema-utils';
import { fixAllForeignKeys } from './fixes/fix-foreign-keys';

/**
 * Add the logo column to workspaces table if it doesn't exist
 */
export async function ensureLogoColumn() {
  console.log('Checking if logo column exists in workspaces table...');
  
  try {
    // Check if logo column exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'workspaces' AND column_name = 'logo'
    `);
    
    // If column doesn't exist, add it
    if (result.rows.length === 0) {
      console.log('Logo column does not exist. Adding it...');
      
      await db.execute(sql`
        ALTER TABLE workspaces 
        ADD COLUMN IF NOT EXISTS logo TEXT
      `);
      
      console.log('Successfully added logo column to workspaces table');
    } else {
      console.log('Logo column already exists in workspaces table');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring logo column exists:', error);
    return false;
  }
}

/**
 * Run all auto-migrations
 */
export async function runAutoMigrations() {
  try {
    console.log('Running auto-migrations...');
    
    // Add any new auto-migrations here
    await ensureLogoColumn();
    
    // Fix schema issues
    await fixSchemaIssues();
    
    // Fix foreign key constraints
    await fixAllForeignKeys();
    
    console.log('Auto-migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error running auto-migrations:', error);
    return false;
  }
}