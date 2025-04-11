import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { donationViews, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Helper function to check access to a donation view
async function checkDonationViewAccess(userId: string, viewId: string) {
  // Get the view to find its workspace
  const view = await db
    .select()
    .from(donationViews)
    .where(eq(donationViews.id, viewId))
    .limit(1);
  
  if (!view || view.length === 0) {
    throw error(404, 'Donation view not found');
  }
  
  // Check user access to workspace
  const userWorkspace = await db
    .select()
    .from(userWorkspaces)
    .where(
      and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, view[0].workspaceId)
      )
    )
    .limit(1);
  
  if (!userWorkspace || userWorkspace.length === 0) {
    throw error(403, 'You do not have access to this donation view');
  }
  
  return view[0];
}

// GET /api/donation-views/[id] - Get a specific donation view
export const GET: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const viewId = params.id;
  
  try {
    // Check access and get view
    const view = await checkDonationViewAccess(user.id, viewId);
    
    // Format for frontend
    const formattedView = {
      id: view.id,
      view_name: view.viewName,
      workspace_id: view.workspaceId,
      amount: view.amount,
      status: view.status,
      payment_type: view.paymentType,
      notes: view.notes,
      filters: view.filters || [],
      sorting: view.sorting || [],
      created_at: view.createdAt,
      updated_at: view.updatedAt
    };
    
    return json({
      view: formattedView
    });
  } catch (err) {
    console.error('Error fetching donation view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch donation view');
  }
};

// PUT /api/donation-views/[id] - Update a donation view
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const viewId = params.id;
  
  try {
    // Check access and get view
    await checkDonationViewAccess(user.id, viewId);
    
    // Get update data from request
    const updateData = await request.json();
    
    // Update fields
    const updateFields: any = {};
    
    if (updateData.view_name !== undefined) {
      updateFields.viewName = updateData.view_name;
    }
    
    if (updateData.amount !== undefined) {
      updateFields.amount = updateData.amount;
    }
    
    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
    }
    
    if (updateData.payment_type !== undefined) {
      updateFields.paymentType = updateData.payment_type;
    }
    
    if (updateData.notes !== undefined) {
      updateFields.notes = updateData.notes;
    }
    
    if (updateData.filters !== undefined) {
      updateFields.filters = updateData.filters;
    }
    
    if (updateData.sorting !== undefined) {
      updateFields.sorting = updateData.sorting;
    }
    
    // Only update if there's data to update
    if (Object.keys(updateFields).length === 0) {
      throw error(400, 'No valid fields to update');
    }
    
    // Set updated timestamp
    updateFields.updatedAt = new Date();
    
    // Update the view
    const [updatedView] = await db
      .update(donationViews)
      .set(updateFields)
      .where(eq(donationViews.id, viewId))
      .returning();
    
    // Format for frontend
    const formattedView = {
      id: updatedView.id,
      view_name: updatedView.viewName,
      workspace_id: updatedView.workspaceId,
      amount: updatedView.amount,
      status: updatedView.status,
      payment_type: updatedView.paymentType,
      notes: updatedView.notes,
      filters: updatedView.filters || [],
      sorting: updatedView.sorting || [],
      created_at: updatedView.createdAt,
      updated_at: updatedView.updatedAt
    };
    
    return json({
      view: formattedView
    });
  } catch (err) {
    console.error('Error updating donation view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update donation view');
  }
};

// DELETE /api/donation-views/[id] - Delete a donation view
export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const viewId = params.id;
  
  try {
    // Check access
    await checkDonationViewAccess(user.id, viewId);
    
    // Delete the view
    await db
      .delete(donationViews)
      .where(eq(donationViews.id, viewId));
    
    return json({
      success: true
    });
  } catch (err) {
    console.error('Error deleting donation view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to delete donation view');
  }
};
