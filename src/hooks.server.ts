// This file initializes server-side resources
import { sequence } from '@sveltejs/kit/hooks';
import { db } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';

// Ensure db is initialized on server start
const dbInitializer: Handle = async ({ event, resolve }) => {
  try {
    // Simply accessing the db object will initialize it if needed
    if (db) {
      // Add db to event.locals for easy access
      event.locals.db = db;
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
  
  return resolve(event);
};

// Export the handle sequence
export const handle = sequence(dbInitializer);
