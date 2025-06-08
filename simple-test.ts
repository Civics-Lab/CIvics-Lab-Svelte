// Simple database connection test
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function simpleTest() {
  console.log('🔗 Testing database connection...');
  
  const client = postgres(connectionString, { max: 1 });
  
  try {
    const db = drizzle(client);
    
    // Simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connected successfully');
    console.log('Test query result:', result);
    
    // Check if the table exists with a simple approach
    try {
      await db.execute(sql`SELECT COUNT(*) FROM interaction_streams LIMIT 1`);
      console.log('✅ interaction_streams table exists and is accessible');
    } catch (error) {
      console.log('❌ interaction_streams table does not exist or is not accessible');
      console.log('Error:', error.message);
      
      // Let's try to create it
      console.log('🔧 Attempting to create table...');
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS interaction_streams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workspace_id UUID,
            contact_id UUID,
            business_id UUID,
            interaction_type TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'active',
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID
          );
        `);
        console.log('✅ Table created successfully');
      } catch (createError) {
        console.log('❌ Failed to create table:', createError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

simpleTest();