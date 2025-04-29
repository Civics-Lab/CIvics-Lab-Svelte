import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { 
  userWorkspaces, 
  donations, 
  contacts, 
  businesses, 
  donationTags 
} from '$lib/db/drizzle/schema';
import { 
  eq, 
  and, 
  ilike
} from 'drizzle-orm';

// Helper function to check access to donations
async function checkDonationAccess(userId: string, donationId: string) {
  // Get donation
  const donation = await db.query.donations.findFirst({
    where: eq(donations.id, donationId)
  });
  
  if (!donation) {
    throw error(404, 'Donation not found');
  }
  
  // Check access to workspace based on contact or business
  let workspaceId = null;
  
  // If it's a contact donation
  if (donation.contactId) {
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, donation.contactId)
    });
    
    if (!contact) {
      throw error(404, 'Contact not found');
    }
    
    workspaceId = contact.workspaceId;
  } 
  // If it's a business donation
  else if (donation.businessId) {
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, donation.businessId)
    });
    
    if (!business) {
      throw error(404, 'Business not found');
    }
    
    workspaceId = business.workspaceId;
  }
  
  if (!workspaceId) {
    throw error(404, 'Workspace not found for this donation');
  }
  
  // Check user access to workspace
  const userWorkspace = await db.query.userWorkspaces.findFirst({
    where: and(
      eq(userWorkspaces.userId, userId),
      eq(userWorkspaces.workspaceId, workspaceId)
    )
  });
  
  if (!userWorkspace) {
    throw error(403, 'You do not have access to this donation');
  }
  
  return donation;
}

// GET /api/donation-tags?donation_id=[id] - Get tags for a donation
// GET /api/donation-tags?query=[search] - Get tag suggestions
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const donationId = url.searchParams.get('donation_id');
    const query = url.searchParams.get('query');
    
    // Case 1: Get tags for a specific donation
    if (donationId) {
      // Check access to the donation first
      await checkDonationAccess(user.id, donationId);
      
      try {
        // Use Drizzle query builder to get tags
        const tags = await db.query.donationTags.findMany({
          where: eq(donationTags.donationId, donationId),
          orderBy: donationTags.tag
        });
        
        return json({ tags });
      } catch (dbError) {
        console.error('SQL error when fetching donation tags:', dbError);
        // In case the table doesn't exist, return an empty array instead of error
        // This allows the UI to still function even if the table is missing
        return json({ tags: [] });
      }
    }
    
    // Case 2: Get tag suggestions based on a search query
    else if (query) {
      try {
        // Use Drizzle query builder to get tag suggestions
        const suggestions = await db
          .select({ tag: donationTags.tag })
          .from(donationTags)
          .where(ilike(donationTags.tag, `%${query}%`))
          .groupBy(donationTags.tag)
          .orderBy(donationTags.tag)
          .limit(10);
        
        return json({ suggestions });
      } catch (dbError) {
        console.error('SQL error when fetching tag suggestions:', dbError);
        // In case the table doesn't exist, return an empty array
        return json({ suggestions: [] });
      }
    }
    
    // Neither donation_id nor query provided
    else {
      throw error(400, 'Either donation_id or query parameter is required');
    }
  } catch (err) {
    console.error('Error fetching donation tags:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to fetch donation tags: ${err.message || 'Unknown error'}`);
  }
};

// POST /api/donation-tags - Create a new tag for a donation
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    const requestData = await request.json();
    const { donationId, tag } = requestData;
    
    if (!donationId) {
      throw error(400, 'Donation ID is required');
    }
    
    if (!tag || typeof tag !== 'string') {
      throw error(400, 'Tag is required and must be a string');
    }
    
    // Check access to the donation
    await checkDonationAccess(user.id, donationId);
    
    try {
      // Use Drizzle to create the tag
      const newTag = await db.insert(donationTags)
        .values({
          donationId,
          tag
        })
        .returning();
      
      if (!newTag || newTag.length === 0) {
        throw error(500, 'Failed to create donation tag');
      }
      
      return json({ tag: newTag[0] }, { status: 201 });
    } catch (dbError) {
      console.error('SQL error when creating donation tag:', dbError);
      
      // For SQL errors, just return a generic error
      throw error(500, `Database error while creating tag: ${dbError.message}`);
    }
  } catch (err) {
    console.error('Error creating donation tag:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to create donation tag: ${err.message || 'Unknown error'}`);
  }
};

// DELETE /api/donation-tags/:id - Delete a tag
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
    
    // Find the tag to get its donation_id
    const tag = await db.query.donationTags.findFirst({
      where: eq(donationTags.id, tagId),
      with: {
        donation: true
      }
    });
    
    if (!tag) {
      throw error(404, 'Tag not found');
    }
    
    // Check access to the associated donation
    await checkDonationAccess(user.id, tag.donationId);
    
    // Delete the tag using Drizzle
    const result = await db.delete(donationTags)
      .where(eq(donationTags.id, tagId))
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