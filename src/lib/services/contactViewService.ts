/**
 * Service for contact view-related API calls
 */

import type { ContactView } from '$lib/types/contact';

/**
 * Fetch all contact views for a workspace
 */
export async function fetchContactViews(workspaceId: string): Promise<ContactView[]> {
  try {
    const response = await fetch(`/api/contact-views?workspace_id=${workspaceId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contact views');
    }
    
    const data = await response.json();
    return data.views;
  } catch (error) {
    console.error('Error in fetchContactViews:', error);
    throw error;
  }
}

/**
 * Fetch a specific contact view
 */
export async function fetchContactView(viewId: string): Promise<ContactView> {
  try {
    const response = await fetch(`/api/contact-views/${viewId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contact view');
    }
    
    const data = await response.json();
    return data.view;
  } catch (error) {
    console.error('Error in fetchContactView:', error);
    throw error;
  }
}

/**
 * Create a new contact view
 */
export async function createContactView(viewData: {
  viewName: string;
  workspaceId: string;
  firstName?: boolean;
  lastName?: boolean;
  middleName?: boolean;
  gender?: boolean;
  race?: boolean;
  pronouns?: boolean;
  vanid?: boolean;
  emails?: boolean;
  phoneNumbers?: boolean;
  addresses?: boolean;
  socialMediaAccounts?: boolean;
  filters?: any[];
  sorting?: any[];
}): Promise<ContactView> {
  try {
    const response = await fetch('/api/contact-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(viewData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create contact view');
    }
    
    const data = await response.json();
    return data.view;
  } catch (error) {
    console.error('Error in createContactView:', error);
    throw error;
  }
}

/**
 * Update an existing contact view
 */
export async function updateContactView(viewId: string, updateData: Partial<ContactView>): Promise<ContactView> {
  try {
    const response = await fetch(`/api/contact-views/${viewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update contact view');
    }
    
    const data = await response.json();
    return data.view;
  } catch (error) {
    console.error('Error in updateContactView:', error);
    throw error;
  }
}

/**
 * Delete a contact view
 */
export async function deleteContactView(viewId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/contact-views/${viewId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete contact view');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteContactView:', error);
    throw error;
  }
}

/**
 * Create a default contact view for a workspace
 */
export async function createDefaultContactView(workspaceId: string): Promise<ContactView> {
  try {
    const defaultView = {
      viewName: 'Default View',
      workspaceId,
      firstName: true,
      lastName: true,
      middleName: false,
      gender: false,
      race: false,
      pronouns: false,
      vanid: false,
      emails: true,
      phoneNumbers: true,
      addresses: false,
      socialMediaAccounts: false,
      filters: [],
      sorting: []
    };
    
    return await createContactView(defaultView);
  } catch (error) {
    console.error('Error in createDefaultContactView:', error);
    throw error;
  }
}
