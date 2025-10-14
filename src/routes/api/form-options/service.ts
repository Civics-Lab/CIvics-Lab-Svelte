import { db } from '$lib/server/db';
import { states, contacts, genders, races } from '$lib/db/drizzle/schema';
import { eq, asc, ilike, and, or } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';

export const formOptionsService = {
  async getStates() {
    const statesList = await db
      .select({
        id: states.id,
        name: states.name,
        abbreviation: states.abbreviation
      })
      .from(states)
      .orderBy(asc(states.name));
    
    return { states: statesList };
  },

  async getGenders() {
    const gendersList = await db
      .select({
        id: genders.id,
        gender: genders.gender
      })
      .from(genders)
      .orderBy(asc(genders.gender));
    
    return { genders: gendersList };
  },

  async getRaces() {
    const racesList = await db
      .select({
        id: races.id,
        race: races.race
      })
      .from(races)
      .orderBy(asc(races.race));
    
    return { races: racesList };
  },

  async getContacts(workspaceId: string, userId: string, searchTerm: string = '') {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    let whereCondition = eq(contacts.workspaceId, workspaceId);
    
    if (searchTerm) {
      whereCondition = and(
        eq(contacts.workspaceId, workspaceId),
        or(
          ilike(contacts.firstName, `%${searchTerm}%`),
          ilike(contacts.lastName, `%${searchTerm}%`)
        )
      );
    }

    const contactsList = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName
      })
      .from(contacts)
      .where(whereCondition)
      .orderBy(asc(contacts.lastName))
      .limit(10);
    
    // Transform to the format expected by the UI
    const formattedContacts = contactsList.map(contact => ({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`
    }));
    
    return { contacts: formattedContacts };
  }
};