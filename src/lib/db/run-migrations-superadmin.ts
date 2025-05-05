import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

const runMigrations = async () => {
  console.log('Starting migrations for Super Admin...');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  try {
    // For migrations, we need a new connection instance with force close enabled
    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);
    
    console.log('Connected to database');
    console.log('Running migrations...');
    
    // This will automatically run needed migrations
    await migrate(db, { migrationsFolder: 'drizzle/migrations' });
    
    console.log('Migrations complete!');
    
    // Close the connection
    await migrationClient.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
