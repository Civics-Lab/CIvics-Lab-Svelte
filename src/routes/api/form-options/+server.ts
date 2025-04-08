import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { genders, races, states, contactTags } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/form-options - Get all form options
export const GET: RequestHandler = async ({ locals, url }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // Get workspace ID from query parameter
    const workspaceId = url.searchParams.get('workspace_id');
    
    // Fetch genders
    const gendersList = await db
      .select()
      .from(genders)
      .orderBy(genders.gender);
    
    // Fetch races
    const racesList = await db
      .select()
      .from(races)
      .orderBy(races.race);
    
    // Fetch states
    const statesList = await db
      .select()
      .from(states)
      .orderBy(states.name);
    
    // Fetch tags (if workspace_id is provided)
    let tagsList = [];
    if (workspaceId) {
      const tagsData = await db
        .select({ tag: contactTags.tag })
        .from(contactTags)
        .where(eq(contactTags.workspaceId, workspaceId))
        .orderBy(contactTags.tag);
      
      // Extract unique tags
      const uniqueTags = new Set();
      tagsData.forEach(item => uniqueTags.add(item.tag));
      tagsList = Array.from(uniqueTags);
    }
    
    return json({
      genders: gendersList,
      races: racesList,
      states: statesList,
      tags: tagsList
    });
  } catch (err) {
    console.error('Error fetching form options:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch form options');
  }
};
