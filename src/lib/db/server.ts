// This file contains server-only database functionality

// Import database connection
import { db } from './drizzle';

// This module exports a function that checks if we're running server-side
// and returns the appropriate database instance
export function getServerDb() {
  return db();
}
