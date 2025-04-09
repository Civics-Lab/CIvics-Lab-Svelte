import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { donations, contacts, userWorkspaces } from '$lib/db/drizzle/schema';
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
  // You might need similar checks for business donations if applicable
  
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
    
    return json({
      donation
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
    
    // Update fields
    const updateFields: any = {};
    
    if (updateData.amount !== undefined && !isNaN(Number(updateData.amount))) {
      updateFields.amount = Number(updateData.amount);
    }
    
    if (updateData.status) {
      updateFields.status = updateData.status;
    }
    
    // Only update if there's data to update
    if (Object.keys(updateFields).length === 0) {
      throw error(400, 'No valid fields to update');
    }
    
    // Set updated timestamp
    updateFields.updatedAt = new Date();
    
    // Update the donation
    const [updatedDonation] = await db
      .update(donations)
      .set(updateFields)
      .where(eq(donations.id, donationId))
      .returning();
    
    return json({
      donation: updatedDonation
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
