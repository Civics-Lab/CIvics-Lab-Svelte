// This file should only be imported by server-side code
import { db as serverDb } from '$lib/db/drizzle/index.server';

// Re-export the database for server-side use
export const db = serverDb;
