import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { donations, contacts, businesses, userWorkspaces, donationTags } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Helper function to check access to the donation
async function checkDonationAccess(userId: string, donationId: string) {
  // Get donation
  const donation = await db
    .select()
    .from(donations)
    .where(eq(donations.id, donationId))
    .limit(1);
  
  if (!donation || donation.length === 0) {
    throw error(404, 'Donation not found');
  }
  
  // If it's a contact donation, check access to the contact's workspace
  if (donation[0].contactId) {
    const contact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, donation[0].contactId))
      .limit(1);
    
    if (!contact || contact.length === 0) {
      throw error(404, 'Contact not found');
    }
    
    // Check user access to workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, userId),
          eq(userWorkspaces.workspaceId, contact[0].workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      throw error(403, 'You do not have access to this donation');
    }
  }
  // If it's a business donation, check access to the business's workspace
  else if (donation[0].businessId) {
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, donation[0].businessId))
      .limit(1);
    
    if (!business || business.length === 0) {
      throw error(404, 'Business not found');
    }
    
    // Check user access to workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, userId),
          eq(userWorkspaces.workspaceId, business[0].workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      throw error(403, 'You do not have access to this donation');
    }
  }
  
  return donation[0];
}

// GET /api/donations/[id] - Get a donation by ID
export const GET: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const donationId = params.id;
  
  try {
    // Check access and get donation
    const donation = await checkDonationAccess(user.id, donationId);
    
    // Fetch donor details (contact or business)
    let donorDetails = {};
    
    if (donation.contactId) {
      const contactResult = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName
        })
        .from(contacts)
        .where(eq(contacts.id, donation.contactId))
        .limit(1);
      
      if (contactResult.length > 0) {
        donorDetails = {
          contact: contactResult[0]
        };
      }
    } else if (donation.businessId) {
      const businessResult = await db
        .select({
          id: businesses.id,
          businessName: businesses.businessName
        })
        .from(businesses)
        .where(eq(businesses.id, donation.businessId))
        .limit(1);
      
      if (businessResult.length > 0) {
        donorDetails = {
          business: businessResult[0]
        };
      }
    }
    
    // Get donation tags
    const tags = await db
      .select()
      .from(donationTags)
      .where(eq(donationTags.donationId, donationId));
    
    return json({
      donation: {
        ...donation,
        ...donorDetails,
        tags: tags || []
      }
    });
  } catch (err) {
    console.error('Error fetching donation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch donation');
  }
};

// PUT /api/donations/[id] - Update a donation
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const donationId = params.id;
  
  try {
    // Check access and get donation
    const donation = await checkDonationAccess(user.id, donationId);
    
    // Get update data from request
    const updateData = await request.json();
    const { donationData, tags } = updateData;
    
    if (!donationData) {
      throw error(400, 'Donation data is required');
    }
    
    // Update fields
    const updateFields: any = {};
    
    if (donationData.amount !== undefined && !isNaN(Number(donationData.amount))) {
      updateFields.amount = Number(donationData.amount);
    }
    
    if (donationData.status) {
      updateFields.status = donationData.status;
    }
    
    if (donationData.paymentType !== undefined) {
      updateFields.paymentType = donationData.paymentType;
    }
    
    if (donationData.notes !== undefined) {
      updateFields.notes = donationData.notes;
    }
    
    // Handle potential changes to contact or business
    // Note: We don't allow changing from contact to business or vice versa
    // That would require deleting and creating a new donation
    
    // Only update if there's data to update
    if (Object.keys(updateFields).length === 0 && !tags) {
      throw error(400, 'No valid fields to update');
    }
    
    // Set updated timestamp
    updateFields.updatedAt = new Date();
    
    let updatedDonation;
    
    // Update the donation if there are fields to update
    if (Object.keys(updateFields).length > 0) {
      [updatedDonation] = await db
        .update(donations)
        .set(updateFields)
        .where(eq(donations.id, donationId))
        .returning();
    } else {
      // If we're only updating tags, still need to get the current donation
      [updatedDonation] = await db
        .select()
        .from(donations)
        .where(eq(donations.id, donationId));
    }
    
    // Handle tag updates if provided
    if (tags) {
      console.log('Processing tag updates:', tags);
      
      // Get existing tags for this donation
      const existingTags = await db
        .select()
        .from(donationTags)
        .where(eq(donationTags.donationId, donationId));
      
      // Extract tag values
      const existingTagValues = existingTags.map(t => t.tag);
      
      // Find tags to add (in new list but not in existing)
      const tagsToAdd = tags.filter(tag => !existingTagValues.includes(tag));
      
      // Find tags to remove (in existing but not in new list)
      const tagsToRemove = existingTags.filter(existingTag => 
        !tags.includes(existingTag.tag)
      );
      
      // Add new tags
      if (tagsToAdd.length > 0) {
        console.log('Adding new tags:', tagsToAdd);
        await db.insert(donationTags).values(
          tagsToAdd.map(tag => ({
            donationId: donationId,
            tag: tag
          }))
        );
      }
      
      // Remove tags that are no longer needed
      if (tagsToRemove.length > 0) {
        console.log('Removing tags:', tagsToRemove.map(t => t.tag));
        for (const tagToRemove of tagsToRemove) {
          await db
            .delete(donationTags)
            .where(eq(donationTags.id, tagToRemove.id));
        }
      }
    }
    
    // Fetch updated donation with donor details
    let donorDetails = {};
    
    if (updatedDonation.contactId) {
      const contactResult = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName
        })
        .from(contacts)
        .where(eq(contacts.id, updatedDonation.contactId))
        .limit(1);
      
      if (contactResult.length > 0) {
        donorDetails = {
          contact: contactResult[0]
        };
      }
    } else if (updatedDonation.businessId) {
      const businessResult = await db
        .select({
          id: businesses.id,
          businessName: businesses.businessName
        })
        .from(businesses)
        .where(eq(businesses.id, updatedDonation.businessId))
        .limit(1);
      
      if (businessResult.length > 0) {
        donorDetails = {
          business: businessResult[0]
        };
      }
    }
    
    // Get updated tags
    const updatedTags = await db
      .select()
      .from(donationTags)
      .where(eq(donationTags.donationId, donationId));
    
    return json({
      donation: {
        ...updatedDonation,
        ...donorDetails,
        tags: updatedTags || []
      }
    });
  } catch (err) {
    console.error('Error updating donation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update donation');
  }
};

// DELETE /api/donations/[id] - Delete a donation
export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const donationId = params.id;
  
  try {
    // Check access
    await checkDonationAccess(user.id, donationId);
    
    // Delete tags first (though onDelete cascade should handle this, we do it explicitly)
    await db
      .delete(donationTags)
      .where(eq(donationTags.donationId, donationId));
    
    // Delete the donation
    await db
      .delete(donations)
      .where(eq(donations.id, donationId));
    
    return json({
      success: true
    });
  } catch (err) {
    console.error('Error deleting donation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to delete donation');
  }
};
