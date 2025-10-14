// src/lib/db/migrate-recurring-donations.ts
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
  console.log('🔄 Running recurring donations and ActBlue integration migration...');

  // Create connection
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Read our custom migration file
    const migrationPath = path.join(process.cwd(), 'src', 'lib', 'db', 'migrations', 'add_recurring_donations_actblue.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully');
    console.log('🔨 Executing migration...');

    // Execute the migration
    await sql.unsafe(migrationSQL);

    console.log('✅ Recurring donations and ActBlue integration migration completed successfully');
    console.log('');
    console.log('📋 Migration Summary:');
    console.log('  ✓ Created product_billing_period enum');
    console.log('  ✓ Created subscription_status enum');
    console.log('  ✓ Created actblue_event_type enum');
    console.log('  ✓ Created products table');
    console.log('  ✓ Created subscriptions table');
    console.log('  ✓ Created actblue_config table');
    console.log('  ✓ Created actblue_webhook_logs table');
    console.log('  ✓ Created actblue_imports table');
    console.log('  ✓ Extended donations table with recurring and ActBlue fields');
    console.log('  ✓ Created all necessary indexes');
    console.log('');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    // End the connection
    await sql.end();
  }
};

main();
