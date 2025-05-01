import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userWorkspaces, users } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// GET /api/workspaces/[workspaceId]/members - Get members of a workspace
export const GET: RequestHandler = async ({ params, locals }) => {
  const { workspaceId } = params;
  const user = locals.user;
  
  console.log(`GET workspace members for ${workspaceId} request from user ${user?.id}`);
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Verify user has access to this workspace
  const { hasAccess, exists } = await verifyWorkspaceAccess(workspaceId, user.id);
  
  console.log(`Workspace access check: exists=${exists}, hasAccess=${hasAccess}`);
  
  // If workspace doesn't exist, return a 404
  if (!exists) {
    throw error(404, 'Workspace not found');
  }
  
  // If user doesn't have access, return a 403
  if (!hasAccess) {
    throw error(403, 'You do not have permission to access this workspace');
  }
  
  try {
    // Get workspace members using raw SQL queries
    const results = await db.select()
      .from(userWorkspaces)
      .leftJoin(users, eq(userWorkspaces.userId, users.id))
      .where(eq(userWorkspaces.workspaceId, workspaceId));
      
    const members = results.map(row => ({
      id: row.user_workspaces.id,
      userId: row.user_workspaces.userId,
      workspaceId: row.user_workspaces.workspaceId,
      role: row.user_workspaces.role,
      createdAt: row.user_workspaces.createdAt?.toISOString(),
      updatedAt: row.user_workspaces.updatedAt?.toISOString(),
      user: {
        id: row.users.id,
        email: row.users.email,
        username: row.users.username,
        displayName: row.users.displayName
      }
    }));
    
    console.log(`Found ${members.length} members for workspace ${workspaceId}`);
    
    return json({ members });
  } catch (err) {
    console.error('Error fetching workspace members:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    // Provide more detailed error message
    if (err instanceof Error) {
      throw error(500, `Failed to fetch workspace members: ${err.message}`);
    }
    
    throw error(500, 'Failed to fetch workspace members');
  }
};

// POST /api/workspaces/[workspaceId]/members - Add a user to a workspace
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const { workspaceId } = params;
  const user = locals.user;
  
  console.log(`POST add member to workspace ${workspaceId} request from user ${user?.id}`);
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  // Verify user has admin access to this workspace
  const { hasAccess, role, exists } = await verifyWorkspaceAccess(workspaceId, user.id);
  
  console.log(`Workspace access check: exists=${exists}, hasAccess=${hasAccess}, role=${role}`);
  
  // If workspace doesn't exist, return a 404
  if (!exists) {
    throw error(404, 'Workspace not found');
  }
  
  // If user doesn't have access or isn't an admin, return a 403
  if (!hasAccess || !['Super Admin', 'Admin'].includes(role)) {
    throw error(403, 'You do not have permission to add members to this workspace');
  }
  
  try {
    const body = await request.json();
    const { userId, role: memberRole } = body;
    
    if (!userId) {
      throw error(400, 'User ID is required');
    }
    
    // Check if the user exists
    const userResults = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
    if (!userResults.length) {
      throw error(404, 'User not found');
    }
    
    // Check if user is already in the workspace
    const existingMemberResults = await db.select()
      .from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, workspaceId)
      ))
      .limit(1);
    
    if (existingMemberResults.length) {
      throw error(400, 'User is already a member of this workspace');
    }
    
    // Add user to workspace
    const newMemberResults = await db.insert(userWorkspaces).values({
      userId,
      workspaceId,
      role: memberRole || 'Basic User' // Default role if not specified
    }).returning();
    
    // Get the full member data to return
    const addedMemberResults = await db.select()
      .from(userWorkspaces)
      .leftJoin(users, eq(userWorkspaces.userId, users.id))
      .where(eq(userWorkspaces.id, newMemberResults[0].id))
      .limit(1);
      
    if (!addedMemberResults.length) {
      throw error(500, 'Failed to retrieve the added member');
    }
    
    const row = addedMemberResults[0];
    const member = {
      id: row.user_workspaces.id,
      userId: row.user_workspaces.userId,
      workspaceId: row.user_workspaces.workspaceId,
      role: row.user_workspaces.role,
      createdAt: row.user_workspaces.createdAt?.toISOString(),
      updatedAt: row.user_workspaces.updatedAt?.toISOString(),
      user: {
        id: row.users.id,
        email: row.users.email,
        username: row.users.username,
        displayName: row.users.displayName
      }
    };
    
    return json({ 
      success: true,
      message: 'User added to workspace',
      member
    });
  } catch (err) {
    console.error('Error adding member to workspace:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, err instanceof Error ? err.message : 'Failed to add member to workspace');
  }
};