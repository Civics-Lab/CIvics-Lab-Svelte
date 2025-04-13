// scripts/run-migrations.js
import { runMigration as addLogoMigration } from '../src/lib/db/migrations/001_add_logo_to_workspaces.js';

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Run all migrations in sequence
    await addLogoMigration();
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();