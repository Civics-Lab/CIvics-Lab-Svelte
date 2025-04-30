import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/workspace-debug
export const GET: RequestHandler = async ({ url }) => {
  console.log('Workspace debug endpoint called');
  const id = url.searchParams.get('id');
  
  const results = {
    message: 'Workspace debug endpoint',
    timestamp: new Date().toISOString(),
    params: { id },
    dbResults: null
  };
  
  // If an ID was provided, attempt to find it in the database
  if (id) {
    try {
      console.log(`Looking up workspace ID: ${id}`);
      const workspace = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, id))
        .limit(1);
      
      results.dbResults = {
        found: workspace.length > 0,
        data: workspace.length > 0 ? workspace[0] : null
      };
    } catch (error) {
      console.error('Database error:', error);
      results.dbResults = {
        error: 'Database error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  return json(results);
};

// PATCH /api/workspace-debug
export const PATCH: RequestHandler = async ({ request, url }) => {
  console.log('Workspace debug PATCH endpoint called');
  const id = url.searchParams.get('id');
  
  try {
    const body = await request.json();
    console.log('Debug PATCH body:', body);
    
    const results = {
      message: 'Workspace debug PATCH received',
      timestamp: new Date().toISOString(),
      id,
      body,
      dbResults: null
    };
    
    // If an ID was provided, attempt to update it in the database
    if (id && body.name) {
      try {
        console.log(`Attempting to update workspace ${id} with name ${body.name}`);
        const [updatedWorkspace] = await db
          .update(workspaces)
          .set({
            name: body.name,
            updatedAt: new Date()
          })
          .where(eq(workspaces.id, id))
          .returning();
        
        results.dbResults = {
          success: !!updatedWorkspace,
          data: updatedWorkspace || null
        };
      } catch (error) {
        console.error('Database update error:', error);
        results.dbResults = {
          error: 'Database update error',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return json(results);
  } catch (err) {
    console.error('Error processing debug request:', err);
    return json({ 
      error: 'Failed to process request',
      message: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 400 });
  }
};
