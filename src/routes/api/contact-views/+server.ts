import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contactViews, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/contact-views - Get all contact views for a workspace
export const GET: RequestHandler = async ({ locals, url }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // Get workspace ID from query parameter or throw an error
    const workspaceId = url.searchParams.get('workspace_id');
    
    if (!workspaceId) {
      throw error(400, 'Workspace ID is required');
    }
    
    // Check if the user has access to this workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, user.id),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      throw error(403, 'You do not have access to this workspace');
    }
    
    // Get all contact views for the workspace
    const views = await db
      .select()
      .from(contactViews)
      .where(eq(contactViews.workspaceId, workspaceId))
      .orderBy(contactViews.viewName);
    
    return json({ views });
  } catch (err) {
    console.error('Error fetching contact views:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch contact views');
  }
};

// POST /api/contact-views - Create a new contact view
export const POST: RequestHandler = async ({ request, locals }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // Get the view data from the request body
    const viewData = await request.json();
    
    if (!viewData.workspaceId) {
      throw error(400, 'Workspace ID is required');
    }
    
    if (!viewData.viewName) {
      throw error(400, 'View name is required');
    }
    
    // Check if the user has access to this workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, user.id),
          eq(userWorkspaces.workspaceId, viewData.workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      throw error(403, 'You do not have access to this workspace');
    }
    
    // Create the view
    const [newView] = await db
      .insert(contactViews)
      .values({
        viewName: viewData.viewName,
        workspaceId: viewData.workspaceId,
        firstName: viewData.firstName ?? true,
        lastName: viewData.lastName ?? true,
        middleName: viewData.middleName ?? false,
        gender: viewData.gender ?? false,
        race: viewData.race ?? false,
        pronouns: viewData.pronouns ?? false,
        vanid: viewData.vanid ?? false,
        emails: viewData.emails ?? true,
        phoneNumbers: viewData.phoneNumbers ?? true,
        addresses: viewData.addresses ?? false,
        socialMediaAccounts: viewData.socialMediaAccounts ?? false,
        filters: viewData.filters ?? [],
        sorting: viewData.sorting ?? [],
        createdById: user.id,
      })
      .returning();
    
    return json({ view: newView }, { status: 201 });
  } catch (err) {
    console.error('Error creating contact view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to create contact view');
  }
};
