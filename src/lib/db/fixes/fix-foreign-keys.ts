/**
 * Script to fix foreign key constraints for cascade deletion
 */
import { db } from '../drizzle';
import { sql } from 'drizzle-orm';

// Tables that reference workspaces
const REFERENCE_TABLES = [
  { table: 'user_workspaces', column: 'workspace_id' },
  { table: 'contacts', column: 'workspace_id' },
  { table: 'contact_tags', column: 'workspace_id' },
  { table: 'contact_views', column: 'workspace_id' },
  { table: 'businesses', column: 'workspace_id' },
  { table: 'business_views', column: 'workspace_id' },
  { table: 'donation_views', column: 'workspace_id' },
  { table: 'workspace_subscriptions', column: 'workspace_id' },
  { table: 'workspace_payments', column: 'workspace_id' },
];

/**
 * Check if a foreign key constraint exists
 */
async function checkForeignKey(table: string, column: string, referencedTable: string): Promise<string | null> {
  console.log(`Checking foreign key for ${table}.${column} -> ${referencedTable}`);
  
  try {
    const result = await db.execute(sql`
      SELECT conname
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE contype = 'f'
      AND n.nspname = 'public'
      AND conrelid = (SELECT oid FROM pg_class WHERE relname = ${table})
      AND confrelid = (SELECT oid FROM pg_class WHERE relname = ${referencedTable})
    `);
    
    if (result.rows.length > 0) {
      const constraintName = result.rows[0].conname;
      console.log(`Found constraint: ${constraintName}`);
      return constraintName;
    }
    
    console.log(`No constraint found for ${table}.${column} -> ${referencedTable}`);
    return null;
  } catch (error) {
    console.error(`Error checking foreign key for ${table}.${column}:`, error);
    return null;
  }
}

/**
 * Fix a foreign key constraint for a particular table
 */
async function fixTableForeignKey(table: string, column: string): Promise<boolean> {
  console.log(`Fixing foreign key for ${table}.${column} -> workspaces.id`);
  
  try {
    // Check if the constraint already exists
    const constraintName = await checkForeignKey(table, column, 'workspaces');
    
    if (constraintName) {
      // Drop the existing constraint
      console.log(`Dropping existing constraint: ${constraintName}`);
      await db.execute(sql`
        ALTER TABLE ${sql.raw(table)}
        DROP CONSTRAINT IF EXISTS ${sql.raw(constraintName)}
      `);
    }
    
    // Create a new constraint name
    const newConstraintName = `${table}_${column}_fkey`;
    
    // Add the new constraint with CASCADE
    console.log(`Adding CASCADE constraint: ${newConstraintName}`);
    await db.execute(sql`
      ALTER TABLE ${sql.raw(table)}
      ADD CONSTRAINT ${sql.raw(newConstraintName)} 
      FOREIGN KEY (${sql.raw(column)}) 
      REFERENCES workspaces(id) 
      ON DELETE CASCADE
    `);
    
    console.log(`Successfully fixed foreign key for ${table}.${column}`);
    return true;
  } catch (error) {
    console.error(`Error fixing foreign key for ${table}.${column}:`, error);
    return false;
  }
}

/**
 * Fix all foreign key constraints that reference workspaces
 */
export async function fixAllForeignKeys(): Promise<void> {
  console.log('Fixing all workspace foreign key constraints...');
  
  let succeededCount = 0;
  let failedCount = 0;
  
  for (const ref of REFERENCE_TABLES) {
    try {
      const success = await fixTableForeignKey(ref.table, ref.column);
      if (success) {
        succeededCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`Error processing ${ref.table}.${ref.column}:`, error);
      failedCount++;
    }
  }
  
  console.log(`Foreign key fixing complete: ${succeededCount} succeeded, ${failedCount} failed`);
}