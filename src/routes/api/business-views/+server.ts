import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { businessViews, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/business-views - Get all business views for the current user's workspace
export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    // Get workspace ID from query parameter
    const workspaceId = url.searchParams.get('workspace_id');
    
    // Verify workspace access
    await verifyWorkspaceAccess(locals.user, workspaceId);
    
    // Get all business views for the workspace
    const views = await db
      .select()
      .from(businessViews)
      .where(eq(businessViews.workspaceId, workspaceId))
      .orderBy(businessViews.viewName);
    
    // Format the response to use camelCase for field names
    const formattedViews = views.map(view => ({
      id: view.id,
      viewName: view.viewName,
      workspaceId: view.workspaceId,
      businessName: view.businessName,
      addresses: view.addresses,
      phoneNumbers: view.phoneNumbers,
      socialMediaAccounts: view.socialMediaAccounts,
      employees: view.employees,
      filters: view.filters,
      sorting: view.sorting,
      createdAt: view.createdAt,
      updatedAt: view.updatedAt,
      createdById: view.createdById
    }));
    
    return json({ views: formattedViews });
  } catch (err) {
    console.error('Error fetching business views:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch business views');
  }
};

// POST /api/business-views - Create a new business view
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get the business view data from the request body
    const requestData = await request.json();
    
    const {
      viewName,
      workspaceId,
      businessName = true,
      addresses = true,
      phoneNumbers = true,
      socialMediaAccounts = false,
      employees = false,
      filters = [],
      sorting = []
    } = requestData;
    
    if (!viewName) {
      throw error(400, 'View name is required');
    }
    
    // Verify workspace access
    await verifyWorkspaceAccess(locals.user, workspaceId);
    
    // Create the business view
    const [newView] = await db
      .insert(businessViews)
      .values({
        viewName,
        workspaceId,
        businessName,
        addresses,
        phoneNumbers,
        socialMediaAccounts,
        employees,
        filters,
        sorting,
        createdById: locals.user.id
      })
      .returning();
    
    // Format the response to use camelCase for field names
    const formattedView = {
      id: newView.id,
      viewName: newView.viewName,
      workspaceId: newView.workspaceId,
      businessName: newView.businessName,
      addresses: newView.addresses,
      phoneNumbers: newView.phoneNumbers,
      socialMediaAccounts: newView.socialMediaAccounts,
      employees: newView.employees,
      filters: newView.filters,
      sorting: newView.sorting,
      createdAt: newView.createdAt,
      updatedAt: newView.updatedAt,
      createdById: newView.createdById
    };
    
    return json({ view: formattedView }, { status: 201 });
  } catch (err) {
    console.error('Error creating business view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to create business view');
  }
};
