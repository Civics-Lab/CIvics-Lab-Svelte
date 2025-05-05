import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/workspaces/[workspaceId]/service-flags
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const { workspaceId } = params;
  
  if (!workspaceId) {
    throw error(400, 'Workspace ID is required');
  }
  
  try {
    // Check if user has access to workspace
    const userWorkspace = await db
      .select({ role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      ))
      .limit(1);
    
    if (!userWorkspace.length) {
      throw error(404, 'Workspace not found or you do not have access');
    }
    
    // Get workspace service flags
    const workspace = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        hasEngage: workspaces.hasEngage,
        hasHelpdesk: workspaces.hasHelpdesk,
        hasPathway: workspaces.hasPathway,
        hasPulse: workspaces.hasPulse,
        hasCompass: workspaces.hasCompass
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    
    if (!workspace.length) {
      throw error(404, 'Workspace not found');
    }
    
    return json({
      serviceFlags: {
        hasEngage: workspace[0].hasEngage,
        hasHelpdesk: workspace[0].hasHelpdesk,
        hasPathway: workspace[0].hasPathway,
        hasPulse: workspace[0].hasPulse,
        hasCompass: workspace[0].hasCompass
      }
    });
  } catch (err) {
    console.error('Error fetching workspace service flags:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch workspace service flags');
  }
};

// PATCH /api/workspaces/[workspaceId]/service-flags
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const { workspaceId } = params;
  
  if (!workspaceId) {
    throw error(400, 'Workspace ID is required');
  }
  
  try {
    // Check if user has Super Admin role for this workspace
    const userWorkspace = await db
      .select({ role: userWorkspaces.role })
      .from(userWorkspaces)
      .where(and(
        eq(userWorkspaces.userId, user.id),
        eq(userWorkspaces.workspaceId, workspaceId)
      ))
      .limit(1);
    
    if (!userWorkspace.length) {
      throw error(404, 'Workspace not found or you do not have access');
    }
    
    const role = userWorkspace[0].role;
    
    // Only Super Admins can update service flags
    if (role !== 'Super Admin') {
      throw error(403, 'Only Super Admins can update service access flags');
    }
    
    // Get the update data from the request body
    const body = await request.json();
    const updates: {
      hasEngage?: boolean;
      hasHelpdesk?: boolean;
      hasPathway?: boolean;
      hasPulse?: boolean;
      hasCompass?: boolean;
    } = {};
    
    if (typeof body.hasEngage === 'boolean') {
      updates.hasEngage = body.hasEngage;
    }
    
    if (typeof body.hasHelpdesk === 'boolean') {
      updates.hasHelpdesk = body.hasHelpdesk;
    }
    
    if (typeof body.hasPathway === 'boolean') {
      updates.hasPathway = body.hasPathway;
    }
    
    if (typeof body.hasPulse === 'boolean') {
      updates.hasPulse = body.hasPulse;
    }
    
    if (typeof body.hasCompass === 'boolean') {
      updates.hasCompass = body.hasCompass;
    }
    
    if (Object.keys(updates).length === 0) {
      throw error(400, 'No valid service flag updates provided');
    }
    
    // Update the workspace service flags
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    if (!updatedWorkspace) {
      throw error(404, 'Workspace not found');
    }
    
    return json({
      serviceFlags: {
        hasEngage: updatedWorkspace.hasEngage,
        hasHelpdesk: updatedWorkspace.hasHelpdesk,
        hasPathway: updatedWorkspace.hasPathway,
        hasPulse: updatedWorkspace.hasPulse,
        hasCompass: updatedWorkspace.hasCompass
      }
    });
  } catch (err) {
    console.error('Error updating workspace service flags:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update workspace service flags');
  }
};
