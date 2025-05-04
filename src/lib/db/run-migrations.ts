// src/lib/db/run-migrations.ts
import { addAvatarToUsers } from './migrations/add-avatar-to-users';

async function runMigrations() {
  console.log('Starting migrations...');
  
  try {
    // Add migrations in sequence
    await addAvatarToUsers();
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runMigrations;
