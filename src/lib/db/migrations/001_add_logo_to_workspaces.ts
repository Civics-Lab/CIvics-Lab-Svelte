import { sql } from 'drizzle-orm';
import { db } from '../drizzle';

/**
 * Add logo column to workspaces table
 */
export async function up() {
  await db.execute(sql`
    ALTER TABLE workspaces 
    ADD COLUMN IF NOT EXISTS logo TEXT;
  `);
  
  console.log('Migration completed: Added logo column to workspaces table');
}

/**
 * Run this migration
 */
export async function runMigration() {
  try {
    console.log('Running migration: Add logo column to workspaces');
    await up();
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}