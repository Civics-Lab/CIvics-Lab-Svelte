import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { workspaces } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// PUT /api/workspaces/[workspaceId]/logo - Update workspace logo
export const PUT: RequestHandler = async ({ params, request, locals }) => {
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
    // Get form data with the image
    const formData = await request.formData();
    const logoFile = formData.get('logo');
    
    if (!logoFile || !(logoFile instanceof File)) {
      throw error(400, 'No logo file provided');
    }
    
    // Convert file to base64 for storage
    const buffer = await logoFile.arrayBuffer();
    const base64Logo = `data:${logoFile.type};base64,${Buffer.from(buffer).toString('base64')}`;
    
    // Update the workspace with the logo
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({ 
        logo: base64Logo,
        updatedAt: new Date()
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    if (!updatedWorkspace) {
      throw error(404, 'Workspace not found');
    }
    
    return json({ 
      success: true, 
      logo: updatedWorkspace.logo 
    });
  } catch (err) {
    console.error('Error updating workspace logo:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update workspace logo');
  }
};

// DELETE /api/workspaces/[workspaceId]/logo - Remove workspace logo
export const DELETE: RequestHandler = async ({ params, locals }) => {
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
    // Update the workspace to remove the logo
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({ 
        logo: null,
        updatedAt: new Date()
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    
    if (!updatedWorkspace) {
      throw error(404, 'Workspace not found');
    }
    
    return json({ success: true });
  } catch (err) {
    console.error('Error removing workspace logo:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to remove workspace logo');
  }
};