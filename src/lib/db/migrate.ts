import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './drizzle/schema';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

// Get database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Make sure the drizzle directory exists
const drizzleDir = path.join(projectRoot, 'drizzle');
if (!fs.existsSync(drizzleDir)) {
  console.log(`Creating migrations directory at ${drizzleDir}`);
  fs.mkdirSync(drizzleDir, { recursive: true });
}

async function main() {
  console.log('Migration started...');
  console.log('Using database:', connectionString.split('@')[1]?.split('/')[0] || 'unknown');
  console.log('Migrations folder:', drizzleDir);

  // For migrations, we use a separate connection
  const migrationClient = postgres(connectionString, { ssl: 'require', max: 1 });
  const db = drizzle(migrationClient, { schema });

  try {
    // This will sync all migrations
    await migrate(db, { migrationsFolder: drizzleDir });

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

main();
