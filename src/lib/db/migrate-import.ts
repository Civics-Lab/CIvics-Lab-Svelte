// src/lib/db/migrate-import.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Get database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const main = async () => {
  console.log('🔄 Running import system migration...');
  
  // Create connection
  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // Read our custom migration file
    const migrationPath = path.join(process.cwd(), 'drizzle', '0005_import_system_simple.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Import system migration completed successfully');
  } catch (error) {
    console.error('❌ Import migration failed:', error);
    process.exit(1);
  } finally {
    // End the connection
    await sql.end();
  }
};

main();
