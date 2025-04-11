/**
 * Service for fetching form options from the API
 */

/**
 * Fetch form options for dropdowns
 * 
 * @param workspaceId Optional workspace ID for workspace-specific data
 * @returns Form options data (genders, races, states, tags)
 */
export async function fetchFormOptions(workspaceId?: string): Promise<{
  genders: { id: string; gender: string }[];
  races: { id: string; race: string }[];
  states: { id: string; name: string; abbreviation: string }[];
  tags: string[];
}> {
  try {
    // Create an object to store all options
    const options = {
      genders: [],
      races: [],
      states: [],
      tags: []
    };
    
    // Fetch each type of options individually
    try {
      // 1. Fetch states
      const statesResponse = await fetch('/api/form-options?type=states');
      if (statesResponse.ok) {
        const statesData = await statesResponse.json();
        options.states = statesData.states || [];
      }
      
      // 2. Fetch genders
      const gendersResponse = await fetch('/api/form-options?type=genders');
      if (gendersResponse.ok) {
        const gendersData = await gendersResponse.json();
        options.genders = gendersData.genders || [];
      }
      
      // 3. Fetch races
      const racesResponse = await fetch('/api/form-options?type=races');
      if (racesResponse.ok) {
        const racesData = await racesResponse.json();
        options.races = racesData.races || [];
      }
      
      // 4. If workspace is provided, fetch workspace-specific data
      if (workspaceId) {
        // In the future, add support for workspace-specific options like tags
      }
      
      return options;
    } catch (error) {
      console.error('Error fetching options categories:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in fetchFormOptions:', error);
    throw error;
  }
}
