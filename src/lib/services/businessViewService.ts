/**
 * Service for business view-related API calls
 */

// Define business view types
export interface BusinessView {
  id: string;
  viewName: string;
  workspaceId: string;
  businessName: boolean;
  addresses: boolean;
  phoneNumbers: boolean;
  socialMediaAccounts: boolean;
  employees: boolean;
  filters: any[];
  sorting: any[];
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

/**
 * Fetch all business views for a workspace
 */
export async function fetchBusinessViews(workspaceId: string): Promise<BusinessView[]> {
  try {
    const response = await fetch(`/api/business-views?workspace_id=${workspaceId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch business views');
    }
    
    const data = await response.json();
    return data.views;
  } catch (error) {
    console.error('Error in fetchBusinessViews:', error);
    throw error;
  }
}

/**
 * Create a new business view
 */
export async function createBusinessView(viewData: {
  viewName: string;
  workspaceId: string;
  businessName?: boolean;
  addresses?: boolean;
  phoneNumbers?: boolean;
  socialMediaAccounts?: boolean;
  employees?: boolean;
  filters?: any[];
  sorting?: any[];
}): Promise<BusinessView> {
  try {
    const response = await fetch('/api/business-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(viewData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create business view');
    }
    
    const data = await response.json();
    return data.view;
  } catch (error) {
    console.error('Error in createBusinessView:', error);
    throw error;
  }
}

/**
 * Update an existing business view
 */
export async function updateBusinessView(viewId: string, updateData: {
  viewName?: string;
  businessName?: boolean;
  addresses?: boolean;
  phoneNumbers?: boolean;
  socialMediaAccounts?: boolean;
  employees?: boolean;
  filters?: any[];
  sorting?: any[];
}): Promise<BusinessView> {
  try {
    const response = await fetch(`/api/business-views/${viewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update business view');
    }
    
    const data = await response.json();
    return data.view;
  } catch (error) {
    console.error('Error in updateBusinessView:', error);
    throw error;
  }
}

/**
 * Delete a business view
 */
export async function deleteBusinessView(viewId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/business-views/${viewId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete business view');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteBusinessView:', error);
    throw error;
  }
}
