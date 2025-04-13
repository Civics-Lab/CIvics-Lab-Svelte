// src/lib/db/create-user-invites.ts
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
  console.log('🔄 Creating user_invites table...');
  console.log(`Using database: ${connectionString.split('@')[1]}`);
  
  // Create connection
  const sql = postgres(connectionString, { ssl: 'require' });
  
  try {
    // First, check if invite_status enum exists
    const enumExists = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'invite_status'
      ) as exists;
    `;
    
    if (!enumExists[0].exists) {
      console.log('Creating invite_status enum...');
      await sql`
        CREATE TYPE "invite_status" AS ENUM('Pending', 'Accepted', 'Declined', 'Expired');
      `;
      console.log('✅ Created invite_status enum');
    } else {
      console.log('✅ invite_status enum already exists');
    }
    
    // Check if user_invites table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'user_invites'
      ) as exists;
    `;
    
    if (!tableExists[0].exists) {
      console.log('Creating user_invites table...');
      
      // Create the user_invites table
      await sql`
        CREATE TABLE "user_invites" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "email" text NOT NULL,
          "workspace_id" uuid REFERENCES "workspaces"("id"),
          "role" "workspace_role" DEFAULT 'Basic User',
          "status" "invite_status" DEFAULT 'Pending',
          "invited_by" uuid REFERENCES "users"("id"),
          "invited_at" timestamp DEFAULT now(),
          "expires_at" timestamp,
          "accepted_at" timestamp,
          "token" text NOT NULL UNIQUE
        );
      `;
      
      console.log('✅ Created user_invites table');
      
      // Create indexes
      console.log('Creating indexes...');
      
      await sql`
        CREATE INDEX "user_invites_email_idx" ON "user_invites" ("email");
      `;
      
      await sql`
        CREATE INDEX "user_invites_workspace_id_idx" ON "user_invites" ("workspace_id");
      `;
      
      await sql`
        CREATE INDEX "user_invites_token_idx" ON "user_invites" ("token");
      `;
      
      console.log('✅ Created indexes on user_invites table');
    } else {
      console.log('✅ user_invites table already exists');
    }
    
    // Verify columns
    console.log('Verifying table structure...');
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user_invites';
    `;
    
    console.log('Table columns:', columns.map(c => c.column_name));
    
    console.log('✅ Setup completed successfully');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    // End the connection
    await sql.end();
  }
  
  // Update the index.ts file to export userInvites
  try {
    const indexPath = path.join(process.cwd(), 'src', 'lib', 'db', 'drizzle', 'index.ts');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if userInvites is already exported
    if (!indexContent.includes('export * from')) {
      // Assuming the file needs to be updated to export everything
      indexContent = `import { drizzle } from 'drizzle-orm/postgres-js';\nimport postgres from 'postgres';\nimport * as schema from './schema';\n\n// Get database URL from environment variables\nconst connectionString = process.env.DATABASE_URL || '';\n\n// Create postgres connection\nconst client = postgres(connectionString, { ssl: 'require' });\n\n// Create database instance with all schemas\nexport const db = drizzle(client, { schema });\n\n// Export everything from schema\nexport * from './schema';\n`;
      
      fs.writeFileSync(indexPath, indexContent);
      console.log('✅ Updated index.ts to export schema');
    } else {
      console.log('✅ index.ts already exports schema');
    }
  } catch (err) {
    console.error('⚠️ Could not update index.ts file:', err);
  }
};

main();
