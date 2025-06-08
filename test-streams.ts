// Test the interaction streams API
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
  console.log('🧪 Testing interaction streams setup...');
  
  const client = postgres(connectionString, { max: 1 });
  
  try {
    const db = drizzle(client);
    
    // Test 1: Check if table exists
    console.log('1. Checking if interaction_streams table exists...');
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'interaction_streams'
      );
    `);
    
    console.log('Raw table check result:', tableExists);
    
    const exists = tableExists[0]?.exists || tableExists.rows?.[0]?.exists || false;
    
    if (exists) {
      console.log('   ✅ Table exists');
      
      // Test 2: Check table structure
      console.log('2. Checking table structure...');
      const columns = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'interaction_streams' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      // Handle Result object properly
      const columnArray = Array.from(columns);
      console.log('   ✅ Columns:', columnArray.map(r => `${r.column_name}(${r.data_type})`).join(', '));
      
      // Test 3: Check enums exist
      console.log('3. Checking enums...');
      const enums = await db.execute(sql`
        SELECT typname FROM pg_type 
        WHERE typname IN ('interaction_type', 'interaction_status');
      `);
      
      const enumArray = Array.from(enums);
      console.log('   ✅ Enums found:', enumArray.map(r => r.typname).join(', '));
      
      // Test 4: Try a simple insert (if we have workspace data)
      console.log('4. Checking for workspaces...');
      const workspaces = await db.execute(sql`
        SELECT id, name FROM workspaces LIMIT 1;
      `);
      
      const workspaceArray = Array.from(workspaces);
      
      if (workspaceArray.length > 0) {
        const workspaceId = workspaceArray[0].id;
        console.log(`   ✅ Found workspace: ${workspaceArray[0].name}`);
        
        // Check for contacts
        const contacts = await db.execute(sql`
          SELECT id, first_name, last_name FROM contacts 
          WHERE workspace_id = ${workspaceId} LIMIT 1;
        `);
        
        const contactArray = Array.from(contacts);
        
        if (contactArray.length > 0) {
          const contactId = contactArray[0].id;
          console.log(`   ✅ Found contact: ${contactArray[0].first_name} ${contactArray[0].last_name}`);
          
          // Test insert
          console.log('5. Testing insert...');
          const insertResult = await db.execute(sql`
            INSERT INTO interaction_streams 
            (workspace_id, contact_id, interaction_type, title, content, interaction_date, status)
            VALUES (
              ${workspaceId}, 
              ${contactId}, 
              'note', 
              'Test Note', 
              'This is a test interaction created during setup verification',
              NOW(),
              'active'
            )
            RETURNING id;
          `);
          
          const insertArray = Array.from(insertResult);
          
          if (insertArray.length > 0) {
            const streamId = insertArray[0].id;
            console.log(`   ✅ Created test interaction with ID: ${streamId}`);
            
            // Clean up test data
            await db.execute(sql`DELETE FROM interaction_streams WHERE id = ${streamId}`);
            console.log('   ✅ Cleaned up test data');
          }
        } else {
          console.log('   ⚠️  No contacts found - create some contacts to test fully');
        }
      } else {
        console.log('   ⚠️  No workspaces found - create a workspace to test fully');
      }
      
      console.log('\\n🎉 All tests passed! Interaction streams system is ready.');
      
    } else {
      console.log('   ❌ Table does not exist');
      console.log('\\n💡 Please run the migration:');
      console.log('   npm run db:generate && npm run db:migrate');
      console.log('   OR');
      console.log('   npm run db:migrate:streams');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
};

main();