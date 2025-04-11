import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { states, contacts, genders, races } from '$lib/db/drizzle/schema';
import { eq, asc, ilike } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/form-options
// Query parameters:
// - type: string (required) - The type of options to fetch (states, contacts, etc.)
// - search: string (optional) - Search term for filtering contacts
export const GET: RequestHandler = async ({ locals, url }) => {
  // Basic authentication check - specific workspace check will be done for routes that need it
  
  try {
    // Get the type of options to fetch
    const optionType = url.searchParams.get('type');
    
    if (!optionType) {
      throw error(400, 'Option type is required');
    }
    
    // Basic authentication check
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Handle different option types
    if (optionType === 'states') {
      // States are global and don't require workspace access check
      const statesList = await db
        .select({
          id: states.id,
          name: states.name,
          abbreviation: states.abbreviation
        })
        .from(states)
        .orderBy(asc(states.name));
      
      return json({ states: statesList });
    } 
    else if (optionType === 'genders') {
      // Genders are global and don't require workspace access check
      const gendersList = await db
        .select({
          id: genders.id,
          gender: genders.gender
        })
        .from(genders)
        .orderBy(asc(genders.gender));
      
      return json({ genders: gendersList });
    }
    else if (optionType === 'races') {
      // Races are global and don't require workspace access check
      const racesList = await db
        .select({
          id: races.id,
          race: races.race
        })
        .from(races)
        .orderBy(asc(races.race));
      
      return json({ races: racesList });
    } 
    else if (optionType === 'contacts') {
      // Get search term for filtering contacts
      const searchTerm = url.searchParams.get('search') || '';
      
      // Get workspace ID for filtering contacts
      const workspaceId = url.searchParams.get('workspace_id');
      
      // Verify workspace access
      await verifyWorkspaceAccess(user, workspaceId);
      
      const contactsList = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName
        })
        .from(contacts)
        .where(
          searchTerm
            ? eq(contacts.workspaceId, workspaceId) && 
              (ilike(contacts.firstName, `%${searchTerm}%`) || ilike(contacts.lastName, `%${searchTerm}%`))
            : eq(contacts.workspaceId, workspaceId)
        )
        .orderBy(asc(contacts.lastName))
        .limit(10);
      
      // Transform to the format expected by the UI
      const formattedContacts = contactsList.map(contact => ({
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`
      }));
      
      return json({ contacts: formattedContacts });
    }
    else {
      throw error(400, `Unsupported option type: ${optionType}`);
    }
  } catch (err) {
    console.error(`Error fetching ${url.searchParams.get('type')} options:`, err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to fetch options: ${err.message || 'Unknown error'}`);
  }
};
