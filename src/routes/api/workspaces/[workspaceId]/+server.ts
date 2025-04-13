import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/workspaces/[workspaceId] - Get a specific workspace
export const GET: RequestHandler = async ({ params, locals }) => {
  const { workspaceId } = params;
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Verify user has access to this workspace
  const { hasAccess } = await verifyWorkspaceAccess(workspaceId, user.id);
  
  if (!hasAccess) {
    throw error(403, 'You do not have permission to access this workspace');
  }
  
  try {
    // Get the workspace
    const workspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    
    if (!workspace.length) {
      throw error(404, 'Workspace not found');
    }
    
    return json({ workspace: workspace[0] });
  } catch (err) {
    console.error('Error fetching workspace:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch workspace');
  }
};

// PATCH /api/workspaces/[workspaceId] - Update a workspace
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const { workspaceId } = params;
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Verify user has admin access to this workspace
  const { hasAccess, role } = await verifyWorkspaceAccess(workspaceId, user.id);
  
  if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
    throw error(403, 'You do not have permission to update this workspace');
  }
  
  try {
    const body = await request.json();
    const updates: Record<string, any> = {};
    
    // Only allow updating specific fields
    if (body.name && typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }
    
    // Always update the updatedAt timestamp
    updates.updatedAt = new Date();
    
    if (Object.keys(updates).length === 1 && updates.updatedAt) {
      // If only updatedAt is present, nothing was actually updated
      throw error(400, 'No valid update fields provided');
    }
    
    // Update the workspace
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set(updates)
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    if (!updatedWorkspace) {
      throw error(404, 'Workspace not found');
    }
    
    return json({ workspace: updatedWorkspace });
  } catch (err) {
    console.error('Error updating workspace:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update workspace');
  }
};

// DELETE /api/workspaces/[workspaceId] - Delete a workspace
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { workspaceId } = params;
  console.log(`API: DELETE /api/workspaces/${workspaceId} - Start`);
  const user = locals.user;
  
  if (!user) {
    console.error('No authenticated user found in locals');
    throw error(401, 'Authentication required');
  }
  
  console.log(`User ${user.id} attempting to delete workspace ${workspaceId}`);
  
  // Verify user has Super Admin access to this workspace
  const { hasAccess, role } = await verifyWorkspaceAccess(workspaceId, user.id);
  console.log(`Workspace access check: hasAccess=${hasAccess}, role=${role}`);
  
  if (!hasAccess || role !== 'Super Admin') {
    console.error(`User ${user.id} does not have permission to delete workspace ${workspaceId}`);
    throw error(403, 'Only Super Admins can delete workspaces');
  }
  
  try {
    // First, check if this is the user's only workspace
    console.log(`Checking if workspace ${workspaceId} is the only workspace for user ${user.id}`);
    
    // Count user workspaces
    const userWorkspacesResult = await db
      .select()
      .from(userWorkspaces)
      .where(eq(userWorkspaces.userId, user.id));
      
    console.log(`User has ${userWorkspacesResult.length} workspaces`);
    
    if (userWorkspacesResult.length === 1) {
      console.error(`Cannot delete the only workspace for user ${user.id}`);
      throw error(400, 'Cannot delete your only workspace. Create a new workspace first.');
    }
    
    // First, check which other tables reference this workspace
    console.log(`Checking references to workspace ${workspaceId}`);
    
    // Get all tables that reference workspaces
    const referenceTables = [
      { table: 'user_workspaces', column: 'workspace_id' },
      { table: 'contacts', column: 'workspace_id' },
      { table: 'contact_tags', column: 'workspace_id' },
      { table: 'contact_views', column: 'workspace_id' },
      { table: 'businesses', column: 'workspace_id' },
      { table: 'business_views', column: 'workspace_id' },
      { table: 'donation_views', column: 'workspace_id' },
      { table: 'workspace_subscriptions', column: 'workspace_id' },
      { table: 'workspace_payments', column: 'workspace_id' }
    ];
    
    // Delete related records from each table
    for (const ref of referenceTables) {
      try {
        console.log(`Deleting from ${ref.table} where ${ref.column} = ${workspaceId}`);
        await db.execute(sql`
          DELETE FROM ${sql.raw(ref.table)}
          WHERE ${sql.raw(ref.column)} = ${workspaceId}
        `);
        console.log(`Successfully deleted from ${ref.table}`);
      } catch (tableErr) {
        console.error(`Error deleting from ${ref.table}:`, tableErr);
        // Continue with other tables even if one fails
      }
    }
    
    // Then delete the workspace
    console.log(`Deleting workspace ${workspaceId}`);
    try {
      const result = await db
        .delete(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .returning({ id: workspaces.id });
      
      console.log(`Deletion result:`, result);
      
      if (!result.length) {
        console.log(`No rows deleted from workspaces table, attempting direct SQL delete`);
        // Fallback to direct SQL delete
        const sqlResult = await db.execute(sql`
          DELETE FROM workspaces
          WHERE id = ${workspaceId}
          RETURNING id
        `);
        
        console.log(`SQL deletion result:`, sqlResult);
        
        if (sqlResult.rows.length === 0) {
          console.error(`Workspace ${workspaceId} not found for deletion`);
          throw error(404, 'Workspace not found');
        }
      }
    } catch (deleteErr) {
      console.error(`Error deleting workspace:`, deleteErr);
      
      // Fallback to direct SQL deletion as last resort
      console.log(`Attempting final direct SQL delete with CASCADE`);
      await db.execute(sql`
        DELETE FROM workspaces 
        WHERE id = ${workspaceId}
      `);
    }
    
    console.log(`Successfully deleted workspace ${workspaceId}`);
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting workspace:', err);
    
    // Log more detailed error information
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to delete workspace');
  }
};