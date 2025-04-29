/**
 * Service for workspace-related API calls
 */

import type { Workspace } from '$lib/types/supabase';

/**
 * Fetch all workspaces for the current user
 */
export async function fetchUserWorkspaces(): Promise<{ workspaces: Workspace[], error?: string }> {
  try {
    const response = await fetch('/api/workspaces');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      console.error('Workspace API error:', errorData);
      throw new Error(errorData.error || `Failed to fetch workspaces: ${response.status}`);
    }
    
    const data = await response.json();
    return data; // Should contain workspaces array and possibly error
  } catch (error) {
    console.error('Error in fetchUserWorkspaces:', error);
    throw error;
  }
}

/**
 * Create a new workspace
 */
export async function createWorkspace(name: string): Promise<Workspace> {
  try {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create workspace');
    }
    
    const data = await response.json();
    return data.workspace;
  } catch (error) {
    console.error('Error in createWorkspace:', error);
    throw error;
  }
}

/**
 * Update an existing workspace
 */
export async function updateWorkspace(id: string, updates: { name?: string }): Promise<Workspace> {
  try {
    const response = await fetch(`/api/workspaces/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      console.error('Workspace update error:', errorData);
      throw new Error(errorData.error || `Failed to update workspace: ${response.status}`);
    }
    
    const data = await response.json();
    return data.workspace;
  } catch (error) {
    console.error('Error in updateWorkspace:', error);
    throw error;
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(id: string): Promise<void> {
  try {
    console.log(`Service: Deleting workspace ${id}`);
    
    const startTime = performance.now();
    const response = await fetch(`/api/workspaces/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const endTime = performance.now();
    console.log(`DELETE request took ${endTime - startTime}ms`);
    
    if (!response.ok) {
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Workspace delete error:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      
      throw new Error(`Failed to delete workspace: ${response.status}`);
    }
    
    console.log(`Successfully deleted workspace ${id}`);
  } catch (error) {
    console.error('Error in deleteWorkspace:', error);
    throw error;
  }
}

/**
 * Upload a logo for a workspace
 */
export async function uploadWorkspaceLogo(id: string, logoFile: File): Promise<string> {
  try {
    console.log(`Uploading logo for workspace ${id}`);
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await fetch(`/api/workspaces/${id}/logo`, {
      method: 'PUT',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      console.error('Logo upload error:', errorData);
      throw new Error(errorData.error || `Failed to upload logo: ${response.status}`);
    }
    
    const data = await response.json();
    return data.logo;
  } catch (error) {
    console.error('Error in uploadWorkspaceLogo:', error);
    throw error;
  }
}

/**
 * Remove a workspace logo
 */
export async function removeWorkspaceLogo(id: string): Promise<void> {
  try {
    console.log(`Removing logo for workspace ${id}`);
    const response = await fetch(`/api/workspaces/${id}/logo`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      console.error('Logo removal error:', errorData);
      throw new Error(errorData.error || `Failed to remove logo: ${response.status}`);
    }
  } catch (error) {
    console.error('Error in removeWorkspaceLogo:', error);
    throw error;
  }
}
