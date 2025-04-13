import { db } from './drizzle';
import { sql } from 'drizzle-orm';

/**
 * Direct script to add the logo column to workspaces table
 * Run with: 
 * npx tsx src/lib/db/run-migration.ts
 */
async function main() {
  console.log('Adding logo column to workspaces table...');
  
  try {
    await db.execute(sql`
      ALTER TABLE workspaces 
      ADD COLUMN IF NOT EXISTS logo TEXT;
    `);
    
    console.log('Successfully added logo column to workspaces table');
    
    // Verify the column was added
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workspaces' AND column_name = 'logo'
    `);
    
    console.log('Verification result:', result.rows);
  } catch (error) {
    console.error('Error adding logo column:', error);
  } finally {
    process.exit(0);
  }
}

main();