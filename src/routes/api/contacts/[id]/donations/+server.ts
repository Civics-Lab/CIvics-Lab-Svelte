import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { donations, contacts, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Helper function to check access to the contact
async function checkContactAccess(userId: string, contactId: string) {
  // Get contact to find workspace
  const contact = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
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
    throw error(403, 'You do not have access to this contact');
  }
  
  return contact[0];
}

// GET /api/contacts/[id]/donations - Get donations for a contact
export const GET: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const contactId = params.id;
  console.log('API: GET donations for contact ID:', contactId);
  
  try {
    // Check access to the contact
    await checkContactAccess(user.id, contactId);
    
    // Get donations for the contact
    const donationsList = await db
      .select()
      .from(donations)
      .where(eq(donations.contactId, contactId))
      .orderBy(donations.createdAt, 'desc');
    
    console.log(`API: Found ${donationsList.length} donations for contact ID ${contactId}`);
    
    return json({
      donations: donationsList
    });
  } catch (err) {
    console.error('Error fetching donations:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch donations');
  }
};

// POST /api/contacts/[id]/donations - Create a donation for a contact
export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const contactId = params.id;
  
  try {
    // Check access to the contact
    await checkContactAccess(user.id, contactId);
    
    // Get donation data from request
    const donationData = await request.json();
    
    // Validate donation data
    if (!donationData.amount || isNaN(Number(donationData.amount))) {
      throw error(400, 'Valid donation amount is required');
    }
    
    // Create the donation
    const [newDonation] = await db
      .insert(donations)
      .values({
        contactId: contactId,
        amount: Number(donationData.amount),
        status: donationData.status || 'donated'
      })
      .returning();
    
    return json({
      donation: newDonation
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating donation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to create donation');
  }
};
