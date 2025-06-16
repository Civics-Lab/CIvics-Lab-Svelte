import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { 
  userWorkspaces, 
  contacts, 
  contactTags 
} from '$lib/db/drizzle/schema';
import { 
  eq, 
  and, 
  ilike
} from 'drizzle-orm';

// Helper function to check access to contact
async function checkContactAccess(userId: string, contactId: string) {
  // Get contact
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId)
  });
  
  if (!contact) {
    throw error(404, 'Contact not found');
  }
  
  // Check user access to workspace
  const userWorkspace = await db.query.userWorkspaces.findFirst({
    where: and(
      eq(userWorkspaces.userId, userId),
      eq(userWorkspaces.workspaceId, contact.workspaceId)
    )
  });
  
  if (!userWorkspace) {
    throw error(403, 'You do not have access to this contact');
  }
  
  return contact;
}

// Helper function to check workspace access
async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  const userWorkspace = await db.query.userWorkspaces.findFirst({
    where: and(
      eq(userWorkspaces.userId, userId),
      eq(userWorkspaces.workspaceId, workspaceId)
    )
  });
  
  if (!userWorkspace) {
    throw error(403, 'You do not have access to this workspace');
  }
  
  return userWorkspace;
}

// GET /api/contact-tags?contact_id=[id] - Get tags for a contact
// GET /api/contact-tags?workspace_id=[id]&query=[search] - Get tag suggestions for workspace
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const contactId = url.searchParams.get('contact_id');
    const workspaceId = url.searchParams.get('workspace_id');
    const query = url.searchParams.get('query');
    
    // Case 1: Get tags for a specific contact
    if (contactId) {
      // Check access to the contact first
      await checkContactAccess(user.id, contactId);
      
      try {
        // Use Drizzle query builder to get tags
        const tags = await db.query.contactTags.findMany({
          where: eq(contactTags.contactId, contactId),
          orderBy: contactTags.tag
        });
        
        return json({ tags });
      } catch (dbError) {
        console.error('SQL error when fetching contact tags:', dbError);
        // In case the table doesn't exist, return an empty array instead of error
        // This allows the UI to still function even if the table is missing
        return json({ tags: [] });
      }
    }
    
    // Case 2: Get tag suggestions based on a search query for a workspace
    else if (workspaceId) {
      // Check access to workspace
      await checkWorkspaceAccess(user.id, workspaceId);
      
      try {
        let dbQuery = db
          .select({ tag: contactTags.tag })
          .from(contactTags)
          .where(eq(contactTags.workspaceId, workspaceId));
        
        // Only add the ILIKE filter if we have a query
        if (query && query.trim()) {
          dbQuery = dbQuery.where(
            and(
              eq(contactTags.workspaceId, workspaceId),
              ilike(contactTags.tag, `%${query}%`)
            )
          );
        }
        
        const suggestions = await dbQuery
          .groupBy(contactTags.tag)
          .orderBy(contactTags.tag)
          .limit(query && query.trim() ? 10 : 20); // More results when showing all
        
        return json({ suggestions: suggestions.map(s => s.tag) });
      } catch (dbError) {
        console.error('SQL error when fetching tag suggestions:', dbError);
        // In case the table doesn't exist, return an empty array
        return json({ suggestions: [] });
      }
    }
    
    // Neither valid params provided
    else {
      throw error(400, 'workspace_id parameter is required');
    }
  } catch (err) {
    console.error('Error fetching contact tags:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to fetch contact tags: ${err.message || 'Unknown error'}`);
  }
};

// POST /api/contact-tags - Create a new tag for a contact
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const requestData = await request.json();
    const { contactId, tag } = requestData;
    
    if (!contactId) {
      throw error(400, 'Contact ID is required');
    }
    
    if (!tag || typeof tag !== 'string') {
      throw error(400, 'Tag is required and must be a string');
    }
    
    // Check access to the contact
    const contact = await checkContactAccess(user.id, contactId);
    
    // Check if tag already exists for this contact
    const existingTag = await db.query.contactTags.findFirst({
      where: and(
        eq(contactTags.contactId, contactId),
        eq(contactTags.tag, tag)
      )
    });
    
    if (existingTag) {
      throw error(409, 'Tag already exists for this contact');
    }
    
    try {
      // Use Drizzle to create the tag
      const newTag = await db.insert(contactTags)
        .values({
          contactId,
          workspaceId: contact.workspaceId,
          tag
        })
        .returning();
      
      if (!newTag || newTag.length === 0) {
        throw error(500, 'Failed to create contact tag');
      }
      
      return json({ tag: newTag[0] }, { status: 201 });
    } catch (dbError) {
      console.error('SQL error when creating contact tag:', dbError);
      
      // For SQL errors, just return a generic error
      throw error(500, `Database error while creating tag: ${dbError.message}`);
    }
  } catch (err) {
    console.error('Error creating contact tag:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to create contact tag: ${err.message || 'Unknown error'}`);
  }
};

// DELETE /api/contact-tags/:id - Delete a tag
export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const tagId = params.id;
    
    if (!tagId) {
      throw error(400, 'Tag ID is required');
    }
    
    // Find the tag to get its contact_id
    const tag = await db.query.contactTags.findFirst({
      where: eq(contactTags.id, tagId)
    });
    
    if (!tag) {
      throw error(404, 'Tag not found');
    }
    
    // Check access to the associated contact
    await checkContactAccess(user.id, tag.contactId);
    
    // Delete the tag using Drizzle
    const result = await db.delete(contactTags)
      .where(eq(contactTags.id, tagId))
      .returning();
    
    if (!result || result.length === 0) {
      throw error(500, 'Failed to delete tag');
    }
    
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting tag:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to delete tag: ${err.message || 'Unknown error'}`);
  }
};
