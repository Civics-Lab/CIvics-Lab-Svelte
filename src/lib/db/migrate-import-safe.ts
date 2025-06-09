// src/lib/db/migrate-import-safe.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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
  console.log('🔄 Running safe import system migration...');
  
  // Create connection
  const sql = postgres(connectionString, { max: 1 });
  
  try {
    // Step 1: Create enums if they don't exist
    console.log('Creating enums...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE import_error_type AS ENUM('validation', 'duplicate', 'processing');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await sql`
      DO $$ BEGIN
        CREATE TYPE import_mode AS ENUM('create_only', 'update_or_create');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await sql`
      DO $$ BEGIN
        CREATE TYPE import_status AS ENUM('pending', 'processing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await sql`
      DO $$ BEGIN
        CREATE TYPE import_type AS ENUM('contacts', 'businesses', 'donations');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Step 2: Create import_sessions table
    console.log('Creating import_sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS import_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid,
        import_type import_type NOT NULL,
        filename text NOT NULL,
        total_records integer NOT NULL,
        processed_records integer DEFAULT 0,
        successful_records integer DEFAULT 0,
        failed_records integer DEFAULT 0,
        status import_status DEFAULT 'pending',
        import_mode import_mode NOT NULL,
        duplicate_field text,
        field_mapping jsonb NOT NULL,
        error_log jsonb,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        created_by uuid
      );
    `;
    
    // Step 3: Create import_errors table
    console.log('Creating import_errors table...');
    await sql`
      CREATE TABLE IF NOT EXISTS import_errors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        import_session_id uuid,
        row_number integer NOT NULL,
        field_name text,
        error_type import_error_type,
        error_message text NOT NULL,
        raw_data jsonb,
        created_at timestamp DEFAULT now()
      );
    `;
    
    // Step 4: Add foreign key constraints
    console.log('Adding foreign key constraints...');
    await sql`
      DO $$ BEGIN
        ALTER TABLE import_sessions ADD CONSTRAINT import_sessions_workspace_id_fkey 
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await sql`
      DO $$ BEGIN
        ALTER TABLE import_sessions ADD CONSTRAINT import_sessions_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await sql`
      DO $$ BEGIN
        ALTER TABLE import_errors ADD CONSTRAINT import_errors_import_session_id_fkey 
        FOREIGN KEY (import_session_id) REFERENCES import_sessions(id) ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Step 5: Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_import_sessions_workspace_id ON import_sessions(workspace_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_import_sessions_created_at ON import_sessions(created_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_import_errors_session_id ON import_errors(import_session_id);`;
    
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
