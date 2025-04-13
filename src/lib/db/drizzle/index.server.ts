// This file is for server-side use only
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Get database URL from environment variables
const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres connection
const client = postgres(connectionString, { ssl: 'require' });

// Create database instance with all schemas
export const db = drizzle(client, { schema });
