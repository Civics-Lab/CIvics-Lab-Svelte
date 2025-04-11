import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { businessViews, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyResourceAccess } from '$lib/utils/auth';



// GET /api/business-views/[id] - Get a specific business view by ID
export const GET: RequestHandler = async ({ params, locals }) => {
  const viewId = params.id;
  
  try {
    // Check view access
    const { resource: view } = await verifyResourceAccess(locals.user, viewId, businessViews);
    
    // Format the response to use camelCase for field names
    const formattedView = {
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
    };
    
    return json({ view: formattedView });
  } catch (err) {
    console.error('Error fetching business view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch business view');
  }
};

// PUT /api/business-views/[id] - Update a business view
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const viewId = params.id;
  
  try {
    // Check view access
    const { resource: view } = await verifyResourceAccess(locals.user, viewId, businessViews);
    
    // Get the updated view data
    const requestData = await request.json();
    
    const {
      viewName,
      businessName,
      addresses,
      phoneNumbers,
      socialMediaAccounts,
      employees,
      filters,
      sorting
    } = requestData;
    
    // Create an update object with only the provided fields
    const updateData: any = {};
    
    if (viewName !== undefined) updateData.viewName = viewName;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (addresses !== undefined) updateData.addresses = addresses;
    if (phoneNumbers !== undefined) updateData.phoneNumbers = phoneNumbers;
    if (socialMediaAccounts !== undefined) updateData.socialMediaAccounts = socialMediaAccounts;
    if (employees !== undefined) updateData.employees = employees;
    if (filters !== undefined) updateData.filters = filters;
    if (sorting !== undefined) updateData.sorting = sorting;
    
    // Add updatedAt field
    updateData.updatedAt = new Date();
    
    // Update the view
    const [updatedView] = await db
      .update(businessViews)
      .set(updateData)
      .where(eq(businessViews.id, viewId))
      .returning();
    
    // Format the response to use camelCase for field names
    const formattedView = {
      id: updatedView.id,
      viewName: updatedView.viewName,
      workspaceId: updatedView.workspaceId,
      businessName: updatedView.businessName,
      addresses: updatedView.addresses,
      phoneNumbers: updatedView.phoneNumbers,
      socialMediaAccounts: updatedView.socialMediaAccounts,
      employees: updatedView.employees,
      filters: updatedView.filters,
      sorting: updatedView.sorting,
      createdAt: updatedView.createdAt,
      updatedAt: updatedView.updatedAt,
      createdById: updatedView.createdById
    };
    
    return json({ view: formattedView });
  } catch (err) {
    console.error('Error updating business view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update business view');
  }
};

// DELETE /api/business-views/[id] - Delete a business view
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const viewId = params.id;
  
  try {
    // Check view access
    await verifyResourceAccess(locals.user, viewId, businessViews);
    
    // Delete the view
    await db
      .delete(businessViews)
      .where(eq(businessViews.id, viewId));
    
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting business view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to delete business view');
  }
};
