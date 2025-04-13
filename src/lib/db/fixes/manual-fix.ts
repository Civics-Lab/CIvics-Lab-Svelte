/**
 * Manual fix script to be run from Node.js runtime
 * 
 * To run:
 * npx tsx src/lib/db/fixes/manual-fix.ts
 */
import { db } from '../drizzle';
import { sql } from 'drizzle-orm';
import { fixAllForeignKeys } from './fix-foreign-keys';

/**
 * Check database status
 */
async function checkDatabaseStatus() {
  try {
    console.log('Checking database status...');
    
    // Check if workspaces table exists
    const workspacesResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'workspaces'
      ) as exists
    `);
    
    const workspacesExist = workspacesResult.rows[0].exists;
    console.log(`Workspaces table exists: ${workspacesExist}`);
    
    if (workspacesExist) {
      // Count workspaces
      const countResult = await db.execute(sql`SELECT COUNT(*) FROM workspaces`);
      console.log(`Workspaces count: ${countResult.rows[0].count}`);
      
      // Check if logo column exists
      const logoColumnResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'workspaces' AND column_name = 'logo'
        ) as exists
      `);
      
      console.log(`Logo column exists: ${logoColumnResult.rows[0].exists}`);
    }
    
    // Check tables that reference workspaces
    const tables = [
      'user_workspaces', 'contacts', 'contact_tags', 'contact_views', 
      'businesses', 'business_views', 'donation_views', 
      'workspace_subscriptions', 'workspace_payments'
    ];
    
    for (const table of tables) {
      const tableResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = ${table}
        ) as exists
      `);
      
      console.log(`${table} table exists: ${tableResult.rows[0].exists}`);
    }
    
    console.log('Database status check complete');
  } catch (error) {
    console.error('Error checking database status:', error);
  }
}

/**
 * Run all manual fixes
 */
async function runManualFixes() {
  try {
    console.log('Running manual fixes...');
    
    // Check database status
    await checkDatabaseStatus();
    
    // Fix foreign keys
    await fixAllForeignKeys();
    
    console.log('Manual fixes completed');
    process.exit(0);
  } catch (error) {
    console.error('Error running manual fixes:', error);
    process.exit(1);
  }
}

// Run the fixes
runManualFixes();