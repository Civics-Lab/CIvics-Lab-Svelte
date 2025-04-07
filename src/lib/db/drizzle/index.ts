import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables from .env file if not in SvelteKit context
// This allows running scripts like migrations and seeding directly
dotenv.config();

// Get database URL from environment variables
// Try to use SvelteKit's env first, fall back to process.env
let connectionString: string;
try {
  // This will work in SvelteKit context
  const { env } = await import('$env/dynamic/private');
  connectionString = env.DATABASE_URL;
} catch (error) {
  // Fall back to process.env when running outside SvelteKit
  connectionString = process.env.DATABASE_URL || '';
}

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres connection
const client = postgres(connectionString, { ssl: 'require' });

// Create database instance with all schemas
export const db = drizzle(client, { schema });

// Export everything from schema
export * from './schema';
