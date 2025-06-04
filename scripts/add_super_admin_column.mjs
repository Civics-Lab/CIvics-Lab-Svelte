// Execute SQL to add the global Super Admin column and create audit logs table
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const main = async () => {
  // Get database connection string
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create database connection
  const sql = postgres(connectionString);
  
  try {
    console.log('🔄 Adding is_global_super_admin column to users table...');
    
    // Add the column if it doesn't exist
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_global_super_admin BOOLEAN DEFAULT false NOT NULL;
    `;
    
    console.log('✅ Column added successfully');
    
    console.log('🔄 Creating audit_logs table...');
    
    // Create the audit logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        workspace_id UUID REFERENCES workspaces(id),
        details JSONB,
        ip_address TEXT,
        timestamp TIMESTAMP DEFAULT now() NOT NULL
      );
    `;
    
    console.log('✅ Audit logs table created successfully');
    
    // Set your user as a global Super Admin
    // Replace with your actual user ID
    const userId = '0dfad5d4-0297-4869-86d4-2d91bb9fb7f6'; // Replace with your actual user ID
    
    console.log(`🔄 Setting user ${userId} as global Super Admin...`);
    
    await sql`
      UPDATE users
      SET is_global_super_admin = true
      WHERE id = ${userId};
    `;
    
    console.log('✅ User updated successfully');
    
    console.log('✅ All operations completed successfully');
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
  } finally {
    // Close the connection
    await sql.end();
    console.log('📡 Database connection closed');
  }
};

main();
