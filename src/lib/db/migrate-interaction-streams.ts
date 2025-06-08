// src/lib/db/migrate-interaction-streams.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const main = async () => {
  console.log('🚀 Running interaction streams migration...');
  
  // Create connection
  const client = postgres(connectionString, { max: 1 });
  
  try {
    const db = drizzle(client);
    
    // Read the migration SQL file
    const migrationPath = resolve(process.cwd(), 'src/lib/db/migrations/add_interaction_streams.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Interaction streams migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // End the connection
    await client.end();
  }
};

main();