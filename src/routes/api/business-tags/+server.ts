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
  and, 
  ilike,
  sql
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

// GET /api/business-tags?business_id=[id] - Get tags for a business
// GET /api/business-tags?workspace_id=[id]&query=[search] - Get tag suggestions for workspace
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const businessId = url.searchParams.get('business_id');
    const workspaceId = url.searchParams.get('workspace_id');
    const query = url.searchParams.get('query');
    
    // Case 1: Get tags for a specific business
    if (businessId) {
      // Check access to the business first
      await checkBusinessAccess(user.id, businessId);
      
      try {
        // Use Drizzle query builder to get tags
        const tags = await db.query.businessTags.findMany({
          where: eq(businessTags.businessId, businessId),
          orderBy: businessTags.tag
        });
        
        return json({ tags });
      } catch (dbError) {
        console.error('SQL error when fetching business tags:', dbError);
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
          .select({ tag: businessTags.tag })
          .from(businessTags)
          .innerJoin(businesses, eq(businessTags.businessId, businesses.id))
          .where(eq(businesses.workspaceId, workspaceId));
        
        // Only add the ILIKE filter if we have a query
        if (query && query.trim()) {
          dbQuery = dbQuery.where(
            and(
              eq(businesses.workspaceId, workspaceId),
              ilike(businessTags.tag, `%${query}%`)
            )
          );
        } else {
          // If no query, just filter by workspace
          dbQuery = dbQuery.where(eq(businesses.workspaceId, workspaceId));
        }
        
        const suggestions = await dbQuery
          .groupBy(businessTags.tag)
          .orderBy(businessTags.tag)
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
    console.error('Error fetching business tags:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to fetch business tags: ${err.message || 'Unknown error'}`);
  }
};

// POST /api/business-tags - Create a new tag for a business
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const requestData = await request.json();
    const { businessId, tag } = requestData;
    
    if (!businessId) {
      throw error(400, 'Business ID is required');
    }
    
    if (!tag || typeof tag !== 'string') {
      throw error(400, 'Tag is required and must be a string');
    }
    
    // Check access to the business
    await checkBusinessAccess(user.id, businessId);
    
    // Check if tag already exists for this business
    const existingTag = await db.query.businessTags.findFirst({
      where: and(
        eq(businessTags.businessId, businessId),
        eq(businessTags.tag, tag)
      )
    });
    
    if (existingTag) {
      throw error(409, 'Tag already exists for this business');
    }
    
    try {
      // Use Drizzle to create the tag
      const newTag = await db.insert(businessTags)
        .values({
          businessId,
          tag
        })
        .returning();
      
      if (!newTag || newTag.length === 0) {
        throw error(500, 'Failed to create business tag');
      }
      
      return json({ tag: newTag[0] }, { status: 201 });
    } catch (dbError) {
      console.error('SQL error when creating business tag:', dbError);
      
      // For SQL errors, just return a generic error
      throw error(500, `Database error while creating tag: ${dbError.message}`);
    }
  } catch (err) {
    console.error('Error creating business tag:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to create business tag: ${err.message || 'Unknown error'}`);
  }
};

// DELETE /api/business-tags/:id - Delete a tag
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
      where: eq(businessTags.id, tagId),
      with: {
        business: true
      }
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
