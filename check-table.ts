// Check if interaction_streams table exists
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const main = async () => {
  console.log('🔍 Checking if interaction_streams table exists...');
  
  const client = postgres(connectionString, { max: 1 });
  
  try {
    const db = drizzle(client);
    
    // Check if table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'interaction_streams'
      );
    `);
    
    const tableExists = result.rows[0]?.exists;
    
    if (tableExists) {
      console.log('✅ interaction_streams table already exists!');
      
      // Check if it has data
      const countResult = await db.execute(sql`SELECT COUNT(*) FROM interaction_streams;`);
      const count = countResult.rows[0]?.count || 0;
      console.log(`📊 Table has ${count} records`);
    } else {
      console.log('❌ interaction_streams table does not exist');
      console.log('💡 Run: npm run db:generate && npm run db:migrate');
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error);
  } finally {
    await client.end();
  }
};

main();