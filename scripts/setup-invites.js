// scripts/setup-invites.js
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Get the SQL migration file
const migrationFile = path.join(__dirname, '..', 'drizzle', '0000_user_invites_table.sql');
const sql = fs.readFileSync(migrationFile, 'utf-8');

// Get database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function setupUserInvites() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🔄 Running user_invites table migration...');
    await client.query(sql);
    console.log('✅ User invites table migration completed successfully');

    return true;
  } catch (error) {
    console.error('❌ Error running migration:', error);
    return false;
  } finally {
    await client.end();
  }
}

// Run the function
setupUserInvites()
  .then(success => {
    if (success) {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Setup failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
