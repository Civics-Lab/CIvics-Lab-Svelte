/**
 * Service for workspace-related API calls
 * Updated to use standalone Hono.js API
 */

import type { Workspace } from '$lib/types/supabase';
import { http } from '$lib/utils/httpClient';
import { API_ENDPOINTS } from '$lib/config/api';

/**
 * Update a workspace using the simple API that uses query parameters instead of path parameters
 */
export async function updateWorkspaceSimple(id: string, updates: { name?: string }): Promise<Workspace> {
  try {
    console.log(`Simple update for workspace ${id} with:`, updates);
    
    const queryParams = new URLSearchParams({ id }).toString();
    const url = `/api/workspace-update?${queryParams}`;
    console.log(`Making simple PATCH request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    console.log(`Simple PATCH response status:`, response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
      console.error('Simple update error:', errorData);
      throw new Error(errorData.message || errorData.error || `Failed to update workspace via simple API: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Simple update result:', data);
    
    if (data.workspace) {
      return data.workspace;
    } else {
      throw new Error('No workspace data returned from simple update endpoint');
    }
  } catch (error) {
    console.error('Error in simple update:', error);
    throw error;
  }
}

/**
 * Use the debug endpoint to update a workspace
 */
export async function updateWorkspaceDebug(id: string, updates: { name?: string }): Promise<Workspace> {
  try {
    console.log(`Debug updating workspace ${id} with:`, updates);
    
    const queryParams = new URLSearchParams({ id }).toString();
    const url = `/api/workspace-debug?${queryParams}`;
    console.log(`Making debug PATCH request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Request': 'true'
      },
      body: JSON.stringify(updates)
    });
    
    console.log(`Debug PATCH response status:`, response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
      console.error('Debug update error:', errorData);
      throw new Error(errorData.message || `Failed to update workspace via debug endpoint: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Debug update result:', data);
    
    if (data.dbResults?.data) {
      return data.dbResults.data;
    } else {
      throw new Error('No workspace data returned from debug endpoint');
    }
  } catch (error) {
    console.error('Error in debug update:', error);
    throw error;
  }
}

/**
 * Test debug endpoint to verify workspace exists
 */
export async function checkWorkspaceDebug(id: string): Promise<any> {
  try {
    console.log(`Debug checking workspace ${id}`);
    
    const queryParams = new URLSearchParams({ id }).toString();
    const url = `/api/workspace-debug?${queryParams}`;
    
    const response = await fetch(url);
    console.log(`Debug check response status:`, response.status);
    
    const data = await response.json();
    console.log('Debug check result:', data);
    
    return data;
  } catch (error) {
    console.error('Error in debug check:', error);
    throw error;
  }
}

/**
 * Update a workspace, throwing an error if it doesn't exist
 */
export async function updateWorkspaceStrict(id: string, updates: { name?: string }): Promise<Workspace> {
  try {
    console.log(`Strictly updating workspace ${id} with:`, updates);
    
    // Try with the query parameter method instead of the path
    const url = `/api/workspace-by-id?id=${encodeURIComponent(id)}`;
    console.log(`Making PATCH request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Info': 'updateWorkspaceStrict'
      },
      body: JSON.stringify(updates)
    });
    
    console.log(`PATCH response status:`, response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
      console.error('Workspace update error:', errorData);
      throw new Error(errorData.message || `Failed to update workspace: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Workspace updated successfully:', data.workspace);
    return data.workspace;
  } catch (error) {
    console.error('Error in updateWorkspaceStrict:', error);
    throw error;
  }
}

/**
 * Create a workspace with the specified ID or create a new one
 */
export async function createOrUpdateWorkspace(updates: { id?: string, name: string }): Promise<Workspace> {
  try {
    console.log('Creating or updating workspace with:', updates);
    
    // If ID is provided, try to update first
    if (updates.id) {
      try {
        const workspace = await updateWorkspace(updates.id, { name: updates.name });
        return workspace;
      } catch (updateError) {
        console.warn('Update failed, will try to create a new workspace:', updateError);
        // Fall through to create a new workspace
      }
    }
    
    // Create a new workspace
    return await createWorkspace(updates.name);
  } catch (error) {
    console.error('Error in createOrUpdateWorkspace:', error);
    throw error;
  }
}

/**
 * Fetch all workspaces for the current user
 */
export async function fetchUserWorkspaces(): Promise<{ workspaces: Workspace[], isGlobalSuperAdmin?: boolean, error?: string }> {
  try {
    const response = await http.get(API_ENDPOINTS.workspaces.list);

    if (!response.success) {
      console.error('Workspace API error:', response.error);
      throw new Error(response.error || 'Failed to fetch workspaces');
    }

    // The standalone API returns { success: true, data: { workspaces: [...], isGlobalSuperAdmin: false } }
    const data = response.data;
    return {
      workspaces: data.workspaces || [],
      isGlobalSuperAdmin: data.isGlobalSuperAdmin || false,
      error: undefined
    };
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
    const response = await http.post(API_ENDPOINTS.workspaces.create, { name });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create workspace');
    }

    return response.data.workspace;
  } catch (error) {
    console.error('Error in createWorkspace:', error);
    throw error;
  }
}

/**
 * Update an existing workspace
 * Note: Standalone API uses PUT instead of PATCH and handles access control internally
 */
export async function updateWorkspace(id: string, updates: { name?: string }): Promise<Workspace> {
  try {
    console.log(`Updating workspace ${id} with:`, updates);

    // Use PUT method as required by standalone API
    const response = await http.put(API_ENDPOINTS.workspaces.update(id), updates);

    if (!response.success) {
      console.error('Workspace update error:', response.error);

      // Handle specific error messages
      if (response.error?.includes('not found')) {
        throw new Error('Workspace not found. It may have been deleted or does not exist.');
      } else if (response.error?.includes('permission') || response.error?.includes('access')) {
        throw new Error('You do not have permission to update this workspace. You need Admin or Super Admin role.');
      }

      throw new Error(response.error || 'Failed to update workspace');
    }

    console.log('Workspace updated successfully:', response.data.workspace);
    return response.data.workspace;
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
    const response = await http.delete(API_ENDPOINTS.workspaces.delete(id));
    const endTime = performance.now();
    console.log(`DELETE request took ${endTime - startTime}ms`);

    if (!response.success) {
      console.error('Workspace delete error:', response.error);
      throw new Error(response.error || 'Failed to delete workspace');
    }

    console.log(`Successfully deleted workspace ${id}`);
  } catch (error) {
    console.error('Error in deleteWorkspace:', error);
    throw error;
  }
}

/**
 * Upload a logo for a workspace
 * Note: FormData uploads need special handling, bypassing the HTTP client for now
 */
export async function uploadWorkspaceLogo(id: string, logoFile: File): Promise<string> {
  try {
    console.log(`Uploading logo for workspace ${id}`);
    const formData = new FormData();
    formData.append('logo', logoFile);

    // Get auth token for manual fetch call
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const response = await http.request(API_ENDPOINTS.workspaces.uploadLogo(id), {
      method: 'POST',
      body: formData,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      includeAuth: true
    });

    if (!response.success) {
      console.error('Logo upload error:', response.error);
      throw new Error(response.error || 'Failed to upload logo');
    }

    return response.data.logo;
  } catch (error) {
    console.error('Error in uploadWorkspaceLogo:', error);
    throw error;
  }
}

/**
 * Remove a workspace logo
 * Note: This endpoint may not be implemented in the standalone API yet
 */
export async function removeWorkspaceLogo(id: string): Promise<void> {
  try {
    console.log(`Removing logo for workspace ${id}`);

    // The standalone API might not have a logo deletion endpoint yet
    // Using PUT with null logo as a workaround
    const response = await http.put(API_ENDPOINTS.workspaces.update(id), { logo: null });

    if (!response.success) {
      console.error('Logo removal error:', response.error);
      throw new Error(response.error || 'Failed to remove logo');
    }
  } catch (error) {
    console.error('Error in removeWorkspaceLogo:', error);
    throw error;
  }
}

/**
 * Test API connectivity
 */
export async function testApiConnectivity(): Promise<any> {
  try {
    // First try GET
    console.log('Testing GET endpoint');
    const getResponse = await fetch('/api/test');
    console.log('GET test response status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('GET test response data:', getData);
    
    // Then try POST
    console.log('Testing POST endpoint');
    const postResponse = await fetch('/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'data' })
    });
    console.log('POST test response status:', postResponse.status);
    const postData = await postResponse.json();
    console.log('POST test response data:', postData);
    
    // Then try PATCH
    console.log('Testing PATCH endpoint');
    const patchResponse = await fetch('/api/test', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: 'patch data' })
    });
    console.log('PATCH test response status:', patchResponse.status);
    const patchData = await patchResponse.json();
    console.log('PATCH test response data:', patchData);
    
    // Now try the workspaces endpoint
    console.log('Testing workspaces endpoint');
    const workspacesResponse = await fetch('/api/workspaces');
    console.log('Workspaces test response status:', workspacesResponse.status);
    const workspacesData = workspacesResponse.ok ? await workspacesResponse.json() : 'Error fetching';
    console.log('Workspaces test data:', workspacesData);
    
    // Now try the echo endpoint
    console.log('Testing echo endpoint');
    const echoId = 'test-' + Date.now().toString().slice(-6);
    const echoResponse = await fetch(`/api/echo/${echoId}`);
    console.log('Echo test response status:', echoResponse.status);
    let echoData = 'Error fetching';
    if (echoResponse.ok) {
      echoData = await echoResponse.json();
      console.log('Echo test data:', echoData);
      
      // If the GET worked, also try PATCH
      console.log('Testing echo PATCH endpoint');
      const echoPatchResponse = await fetch(`/api/echo/${echoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'echo patch data' })
      });
      console.log('Echo PATCH test response status:', echoPatchResponse.status);
      if (echoPatchResponse.ok) {
        const echoPatchData = await echoPatchResponse.json();
        console.log('Echo PATCH test data:', echoPatchData);
        echoData = { get: echoData, patch: echoPatchData };
      }
    } else {
      console.error('Echo endpoint failed:', echoResponse.status);
    }
    
    return {
      get: getData,
      post: postData,
      patch: patchData,
      workspaces: workspacesData,
      echo: echoData
    };
  } catch (error) {
    console.error('Error testing API connectivity:', error);
    throw error;
  }
}
