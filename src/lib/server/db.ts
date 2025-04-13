// This file should only be imported by server-side code
import { db as serverDb, getDb } from '$lib/db/drizzle/index.server';

// Make sure the DB is initialized
const db = serverDb || getDb();

// Re-export the database for server-side use
export { db };
