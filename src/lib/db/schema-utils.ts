/**
 * Database schema utilities to check and fix foreign key constraints
 */
import { db } from './drizzle';
import { sql } from 'drizzle-orm';

/**
 * Check if foreign key constraints exist for a table
 */
export async function checkForeignKeyConstraints(table: string): Promise<boolean> {
  console.log(`Checking foreign key constraints for table: ${table}`);
  
  try {
    const result = await db.execute(sql`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE contype = 'f' 
      AND n.nspname = 'public'
      AND conrelid = (SELECT oid FROM pg_class WHERE relname = ${table} AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    `);
    
    console.log(`Found ${result.rows.length} foreign key constraints for table ${table}:`);
    for (const row of result.rows) {
      console.log(`  - ${row.conname}: ${row.pg_get_constraintdef}`);
    }
    
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error checking foreign key constraints for table ${table}:`, error);
    return false;
  }
}

/**
 * Add ON DELETE CASCADE to user_workspaces.workspace_id foreign key
 */
export async function fixUserWorkspacesForeignKey(): Promise<boolean> {
  console.log('Fixing user_workspaces foreign key constraints...');
  
  try {
    // First, find the existing constraint
    const constraints = await db.execute(sql`
      SELECT conname
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE contype = 'f'
      AND n.nspname = 'public'
      AND conrelid = (SELECT oid FROM pg_class WHERE relname = 'user_workspaces')
      AND confrelid = (SELECT oid FROM pg_class WHERE relname = 'workspaces')
    `);
    
    if (constraints.rows.length === 0) {
      console.error('No foreign key constraint found between user_workspaces and workspaces');
      return false;
    }
    
    const constraintName = constraints.rows[0].conname;
    console.log(`Found constraint: ${constraintName}`);
    
    // Drop the existing constraint
    await db.execute(sql`
      ALTER TABLE user_workspaces
      DROP CONSTRAINT ${sql.raw(constraintName)}
    `);
    
    console.log(`Dropped constraint: ${constraintName}`);
    
    // Add the new constraint with CASCADE
    await db.execute(sql`
      ALTER TABLE user_workspaces
      ADD CONSTRAINT ${sql.raw(constraintName)} FOREIGN KEY (workspace_id)
      REFERENCES workspaces(id) ON DELETE CASCADE
    `);
    
    console.log(`Added new constraint with ON DELETE CASCADE: ${constraintName}`);
    return true;
  } catch (error) {
    console.error('Error fixing user_workspaces foreign key:', error);
    return false;
  }
}

/**
 * Fix all known schema issues
 */
export async function fixSchemaIssues(): Promise<boolean> {
  try {
    const hasConstraints = await checkForeignKeyConstraints('user_workspaces');
    
    if (hasConstraints) {
      await fixUserWorkspacesForeignKey();
    } else {
      console.log('No existing foreign key constraints to fix');
    }
    
    return true;
  } catch (error) {
    console.error('Error fixing schema issues:', error);
    return false;
  }
}