// scripts/migrate-avatar.mjs
import dotenv from 'dotenv';
import pg from 'pg';

// Initialize environment variables
dotenv.config();

const { Pool } = pg;

async function migrateDatabase() {
  console.log('Starting avatar column migration...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create a PostgreSQL client
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Check if the avatar column exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatar'
    `;
    
    const checkResult = await pool.query(checkColumnQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('Avatar column does not exist, adding it now...');
      
      // Add the avatar column
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN avatar TEXT
      `);
      
      console.log('Avatar column added successfully');
    } else {
      console.log('Avatar column already exists');
    }
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('Migration completed successfully');
}

// Run the migration
migrateDatabase()
  .then(() => console.log('Done!'))
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
