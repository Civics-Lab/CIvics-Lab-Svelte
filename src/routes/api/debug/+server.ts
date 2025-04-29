import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

/**
 * Debug endpoint to check database and auth status
 */
export const GET: RequestHandler = async ({ locals }) => {
  const results = {
    auth: {
      user: locals.user ? {
        id: locals.user.id,
        email: locals.user.email,
        role: locals.user.role
      } : null,
      hasToken: !!locals.token
    },
    database: {
      tablesExist: false,
      workspaceColumns: [],
      error: null
    }
  };
  
  try {
    // Check if tables exist
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    results.database.tablesExist = tables.rows.length > 0;
    
    // Get workspace table columns
    const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workspaces'
    `);
    
    results.database.workspaceColumns = columns.rows.map(row => ({
      name: row.column_name,
      type: row.data_type
    }));
  } catch (error) {
    results.database.error = error instanceof Error ? 
      error.message : 
      'Unknown database error';
  }
  
  return json(results);
};