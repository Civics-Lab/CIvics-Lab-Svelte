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
  and
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

// DELETE /api/contact-tags/[id] - Delete a specific tag
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
