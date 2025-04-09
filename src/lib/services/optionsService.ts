/**
 * Service for fetching form options from the API
 */

/**
 * Fetch form options for dropdowns
 * 
 * @param workspaceId Optional workspace ID for tags
 * @returns Form options data (genders, races, states, tags)
 */
export async function fetchFormOptions(workspaceId?: string): Promise<{
  genders: { id: string; gender: string }[];
  races: { id: string; race: string }[];
  states: { id: string; name: string; abbreviation: string }[];
  tags: string[];
}> {
  try {
    const url = workspaceId 
      ? `/api/form-options?workspace_id=${workspaceId}`
      : '/api/form-options';
      
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch form options');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in fetchFormOptions:', error);
    throw error;
  }
}
