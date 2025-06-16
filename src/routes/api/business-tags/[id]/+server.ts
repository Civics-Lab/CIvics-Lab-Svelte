import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { 
  userWorkspaces, 
  businesses, 
  businessTags 
} from '$lib/db/drizzle/schema';
import { 
  eq, 
  and
} from 'drizzle-orm';

// Helper function to check access to business
async function checkBusinessAccess(userId: string, businessId: string) {
  // Get business
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId)
  });
  
  if (!business) {
    throw error(404, 'Business not found');
  }
  
  // Check user access to workspace
  const userWorkspace = await db.query.userWorkspaces.findFirst({
    where: and(
      eq(userWorkspaces.userId, userId),
      eq(userWorkspaces.workspaceId, business.workspaceId)
    )
  });
  
  if (!userWorkspace) {
    throw error(403, 'You do not have access to this business');
  }
  
  return business;
}

// DELETE /api/business-tags/[id] - Delete a specific tag
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
    
    // Find the tag to get its business_id
    const tag = await db.query.businessTags.findFirst({
      where: eq(businessTags.id, tagId)
    });
    
    if (!tag) {
      throw error(404, 'Tag not found');
    }
    
    // Check access to the associated business
    await checkBusinessAccess(user.id, tag.businessId);
    
    // Delete the tag using Drizzle
    const result = await db.delete(businessTags)
      .where(eq(businessTags.id, tagId))
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
