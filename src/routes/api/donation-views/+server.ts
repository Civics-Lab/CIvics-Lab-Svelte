import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { donationViews, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from './$types';

// GET /api/donation-views?workspace_id=[workspace_id] - Get donation views for a workspace
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const workspaceId = url.searchParams.get('workspace_id');
  
  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }
  
  try {
    // Check if user has access to this workspace
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
    
    // Get all donation views for this workspace
    const views = await db
      .select()
      .from(donationViews)
      .where(eq(donationViews.workspaceId, workspaceId))
      .orderBy(donationViews.viewName);
    
    // Transform field names to use consistent camelCase
    const formattedViews = views.map(view => ({
      id: view.id,
      viewName: view.viewName,
      workspaceId: view.workspaceId,
      amount: view.amount,
      status: view.status,
      paymentType: view.paymentType,
      notes: view.notes,
      filters: view.filters || [],
      sorting: view.sorting || [],
      createdAt: view.createdAt,
      updatedAt: view.updatedAt
    }));
    
    return json({
      views: formattedViews
    });
  } catch (err) {
    console.error('Error fetching donation views:', err);
    throw error(500, `Failed to fetch donation views: ${err.message || 'Unknown error'}`);
  }
};

// POST /api/donation-views - Create a new donation view
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // Parse request body
    const requestData = await request.json();
    
    if (!requestData.viewName) {
      throw error(400, 'View name is required');
    }
    
    if (!requestData.workspaceId) {
      throw error(400, 'Workspace ID is required');
    }
    
    // Check if user has access to this workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, user.id),
          eq(userWorkspaces.workspaceId, requestData.workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      throw error(403, 'You do not have access to this workspace');
    }
    
    // Create new view with consistent field names
    const newView = {
      id: uuidv4(),
      viewName: requestData.viewName,
      workspaceId: requestData.workspaceId,
      amount: requestData.amount !== undefined ? requestData.amount : true,
      status: requestData.status !== undefined ? requestData.status : true,
      paymentType: requestData.paymentType !== undefined ? requestData.paymentType : true,
      notes: requestData.notes !== undefined ? requestData.notes : false,
      filters: requestData.filters || [],
      sorting: requestData.sorting || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: user.id
    };
    
    // Insert the view
    try {
      const [createdView] = await db
        .insert(donationViews)
        .values(newView)
        .returning();
      
      // Return consistent camelCase format
      const formattedView = {
        id: createdView.id,
        viewName: createdView.viewName,
        workspaceId: createdView.workspaceId,
        amount: createdView.amount,
        status: createdView.status,
        paymentType: createdView.paymentType,
        notes: createdView.notes,
        filters: createdView.filters || [],
        sorting: createdView.sorting || [],
        createdAt: createdView.createdAt,
        updatedAt: createdView.updatedAt
      };
      
      return json({
        view: formattedView
      }, { status: 201 });
    } catch (insertErr) {
      console.error('Error inserting donation view:', insertErr);
      throw error(500, `Failed to insert donation view: ${insertErr.message || 'Unknown error'}`);
    }
  } catch (err) {
    console.error('Error creating donation view:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to create donation view: ${err.message || 'Unknown error'}`);
  }
};
