// Only export the schema
// This file can be imported by client-side code safely
export * from './schema';

// Create a stub for the database instance
// Will be replaced by the real implementation in server-side code
export function db() {
  throw new Error('Attempting to use database on the client side');
}
