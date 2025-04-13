// This file is for server-side use only
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Ensure consistent database instance
let _client;
let _db;

// Initialize database connection
export function getDb() {
  if (_db) return _db;
  
  try {
    console.log('Initializing database connection...');
    
    // Get database URL from environment variables
    const connectionString = env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create postgres connection with explicit options
    _client = postgres(connectionString, { 
      ssl: 'require',
      max: 10, // connection pool size
      idle_timeout: 30, // close connections after 30 seconds
      connect_timeout: 10, // timeout connecting after 10 seconds
      prepare: false // disable statement caching in serverless environment
    });

    // Create database instance with all schemas
    _db = drizzle(_client, { schema });
    
    console.log('Database connection initialized successfully.');
    
    return _db;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

// Initialize immediately
const db = getDb();

// Export the already initialized db instance
export { db };
