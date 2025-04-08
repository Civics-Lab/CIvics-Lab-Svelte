import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { contactViews, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Utility function to check workspace access and get view
async function checkViewAccess(userId: string, viewId: string) {
  // First, get the view to determine its workspace
  const [view] = await db
    .select()
    .from(contactViews)
    .where(eq(contactViews.id, viewId))
    .limit(1);
  
  if (!view) {
    throw error(404, 'Contact view not found');
  }
  
  // Then check if the user has access to this workspace
  const [userWorkspace] = await db
    .select()
    .from(userWorkspaces)
    .where(
      and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, view.workspaceId)
      )
    )
    .limit(1);
  
  if (!userWorkspace) {
    throw error(403, 'You do not have access to this contact view');
  }
  
  return { view, userWorkspace };
}

// GET /api/contact-views/[id] - Get a specific contact view
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const viewId = params.id;
  
  try {
    // Check access and get view
    const { view } = await checkViewAccess(user.id, viewId);
    
    return json({ view });
  } catch (err) {
    console.error('Error fetching contact view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch contact view');
  }
};

// PUT /api/contact-views/[id] - Update a contact view
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const viewId = params.id;
  
  try {
    // Check access and get view
    const { view } = await checkViewAccess(user.id, viewId);
    
    // Get updated view data
    const updateData = await request.json();
    
    // Update the view
    const [updatedView] = await db
      .update(contactViews)
      .set({
        viewName: updateData.viewName ?? view.viewName,
        firstName: updateData.firstName ?? view.firstName,
        lastName: updateData.lastName ?? view.lastName,
        middleName: updateData.middleName ?? view.middleName,
        gender: updateData.gender ?? view.gender,
        race: updateData.race ?? view.race,
        pronouns: updateData.pronouns ?? view.pronouns,
        vanid: updateData.vanid ?? view.vanid,
        emails: updateData.emails ?? view.emails,
        phoneNumbers: updateData.phoneNumbers ?? view.phoneNumbers,
        addresses: updateData.addresses ?? view.addresses,
        socialMediaAccounts: updateData.socialMediaAccounts ?? view.socialMediaAccounts,
        filters: updateData.filters ?? view.filters,
        sorting: updateData.sorting ?? view.sorting,
        updatedAt: new Date()
      })
      .where(eq(contactViews.id, viewId))
      .returning();
    
    return json({ view: updatedView });
  } catch (err) {
    console.error('Error updating contact view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update contact view');
  }
};

// DELETE /api/contact-views/[id] - Delete a contact view
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const viewId = params.id;
  
  try {
    // Check access
    await checkViewAccess(user.id, viewId);
    
    // Delete the view
    await db
      .delete(contactViews)
      .where(eq(contactViews.id, viewId));
    
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting contact view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to delete contact view');
  }
};
