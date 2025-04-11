/**
 * Service for retrieving form options
 */

/**
 * Fetch state options for dropdowns
 */
export async function fetchStateOptions(): Promise<{id: string, name: string, abbreviation: string}[]> {
  try {
    const response = await fetch(`/api/form-options?type=states`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch state options');
    }
    
    const data = await response.json();
    return data.states || [];
  } catch (error) {
    console.error('Error in fetchStateOptions:', error);
    throw error;
  }
}

/**
 * Fetch contact options for employee selection
 */
export async function fetchContactOptions(workspaceId: string, searchTerm: string = ''): Promise<{id: string, name: string}[]> {
  try {
    const response = await fetch(`/api/form-options?type=contacts&workspace_id=${workspaceId}&search=${encodeURIComponent(searchTerm)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contact options');
    }
    
    const data = await response.json();
    return data.contacts || [];
  } catch (error) {
    console.error('Error in fetchContactOptions:', error);
    throw error;
  }
}
