import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { donations, contacts, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyResourceAccess } from '$lib/utils/auth';



// GET /api/contacts/[id]/donations - Get donations for a contact
export const GET: RequestHandler = async ({ params, locals }) => {
  const contactId = params.id;
  console.log('API: GET donations for contact ID:', contactId);
  
  try {
    // Check access to the contact
    const { resource: contact } = await verifyResourceAccess(locals.user, contactId, contacts);
    
    // Get donations for the contact
    const donationsList = await db
      .select()
      .from(donations)
      .where(eq(donations.contactId, contactId))
      .orderBy(donations.createdAt, 'desc');
    
    console.log(`API: Found ${donationsList.length} donations for contact ID ${contactId}`);
    
    // Get simplified contact information
    const contactInfo = {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName
    };
    
    // Add contact info to each donation
    const donationsWithContact = donationsList.map(donation => ({
      ...donation,
      contact: contactInfo
    }));
    
    return json({
      donations: donationsWithContact
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
  const contactId = params.id;
  
  try {
    // Check access to the contact
    const { resource: contact } = await verifyResourceAccess(locals.user, contactId, contacts);
    
    // Get donation data from request
    const donationData = await request.json();
    
    // Validate donation data
    if (!donationData.amount || isNaN(Number(donationData.amount))) {
      throw error(400, 'Valid donation amount is required');
    }
    
    // Create donation object
    const newDonationValues = {
      contactId: contactId,
      businessId: null, // Ensure no business is associated
      amount: Number(donationData.amount),
      status: donationData.status || 'promise',
      notes: donationData.notes || null,
      paymentType: donationData.paymentType || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create the donation
    const [newDonation] = await db
      .insert(donations)
      .values(newDonationValues)
      .returning();
    
    // Fetch contact details to include in response
    const contactResult = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName
      })
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);
    
    const donationWithContact = {
      ...newDonation,
      contact: contactResult[0]
    };
    
    return json({
      donation: donationWithContact
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating donation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to create donation');
  }
};
