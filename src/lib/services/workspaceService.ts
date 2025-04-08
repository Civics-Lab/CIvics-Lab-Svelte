/**
 * Service for workspace-related API calls
 */

import type { Workspace } from '$lib/types/supabase';

/**
 * Fetch all workspaces for the current user
 */
export async function fetchUserWorkspaces(): Promise<Workspace[]> {
  try {
    const response = await fetch('/api/workspaces');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch workspaces');
    }
    
    const data = await response.json();
    return data.workspaces;
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
