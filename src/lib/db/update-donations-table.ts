import 'dotenv/config';
import postgres from 'postgres';

// Get database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Starting direct table update...');
  console.log('Using database:', connectionString.split('@')[1]?.split('/')[0] || 'unknown');

  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    // Execute ALTER TABLE commands directly
    console.log('Adding payment_type column to donations table...');
    await sql`ALTER TABLE donations ADD COLUMN IF NOT EXISTS payment_type TEXT`;
    
    console.log('Adding notes column to donations table...');
    await sql`ALTER TABLE donations ADD COLUMN IF NOT EXISTS notes TEXT`;
    
    console.log('Table update completed successfully');
  } catch (error) {
    console.error('Table update failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await sql.end();
  }
}

main();
