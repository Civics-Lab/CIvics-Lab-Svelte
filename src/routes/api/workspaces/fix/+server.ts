import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// POST /api/workspaces/fix - Fix permissions for a workspace
export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const body = await request.json();
    const { workspaceId, role = 'Super Admin' } = body;
    
    if (!workspaceId) {
      throw error(400, 'Workspace ID is required');
    }
    
    console.log(`Fixing permissions for workspace ${workspaceId}`);
    
    // First, check if the workspace exists
    const workspaceExists = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId));
    
    if (!workspaceExists || workspaceExists.length === 0) {
      throw error(404, 'Workspace not found');
    }
    
    // Check if the user already has access to this workspace
    const userWorkspaceData = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.workspaceId, workspaceId),
          eq(userWorkspaces.userId, user.id)
        )
      )
      .limit(1);
    
    if (userWorkspaceData && userWorkspaceData.length > 0) {
      // User already has access, update the role if needed
      if (userWorkspaceData[0].role !== role) {
        // Update the role
        await db
          .update(userWorkspaces)
          .set({ role })
          .where(eq(userWorkspaces.id, userWorkspaceData[0].id));
          
        console.log(`Updated user ${user.id} role to ${role} for workspace ${workspaceId}`);
      } else {
        console.log(`User ${user.id} already has ${role} role for workspace ${workspaceId}`);
      }
      
      return json({
        success: true,
        message: `User already has access to this workspace with role ${userWorkspaceData[0].role}`,
        updated: userWorkspaceData[0].role !== role
      });
    }
    
    // User doesn't have access, add them to the workspace
    await db
      .insert(userWorkspaces)
      .values({
        userId: user.id,
        workspaceId: workspaceId,
        role
      });
      
    console.log(`Added user ${user.id} to workspace ${workspaceId} with role ${role}`);
    
    return json({
      success: true,
      message: `User added to workspace with role ${role}`,
      added: true
    });
  } catch (err) {
    console.error('Error fixing workspace permissions:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    if (err instanceof Error) {
      throw error(500, `Failed to fix workspace permissions: ${err.message}`);
    }
    
    throw error(500, 'Failed to fix workspace permissions');
  }
};
