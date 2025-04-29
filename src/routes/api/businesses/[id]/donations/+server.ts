import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { donations, businesses, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Helper function to check access to the business
async function checkBusinessAccess(userId: string, businessId: string) {
  // Get business to find workspace
  const business = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
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
    throw error(403, 'You do not have access to this business');
  }
  
  return business[0];
}

// GET /api/businesses/[id]/donations - Get donations for a business
export const GET: RequestHandler = async ({ params, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const businessId = params.id;
  console.log('API: GET donations for business ID:', businessId);
  
  try {
    // Check access to the business
    const business = await checkBusinessAccess(user.id, businessId);
    
    // Get donations for the business
    const donationsList = await db
      .select()
      .from(donations)
      .where(eq(donations.businessId, businessId))
      .orderBy(donations.createdAt, 'desc');
    
    console.log(`API: Found ${donationsList.length} donations for business ID ${businessId}`);
    
    // Get simplified business information
    const businessInfo = {
      id: business.id,
      businessName: business.businessName
    };
    
    // Add business info to each donation
    const donationsWithBusiness = donationsList.map(donation => ({
      ...donation,
      business: businessInfo
    }));
    
    return json({
      donations: donationsWithBusiness
    });
  } catch (err) {
    console.error('Error fetching donations:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch donations');
  }
};

// POST /api/businesses/[id]/donations - Create a donation for a business
export const POST: RequestHandler = async ({ params, request, locals }) => {
  // Check authentication
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const businessId = params.id;
  
  try {
    // Check access to the business
    await checkBusinessAccess(user.id, businessId);
    
    // Get donation data from request
    const donationData = await request.json();
    
    // Validate donation data
    if (!donationData.amount || isNaN(Number(donationData.amount))) {
      throw error(400, 'Valid donation amount is required');
    }
    
    // Create donation object
    const newDonationValues = {
      businessId: businessId,
      contactId: null, // Ensure no contact is associated
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
    
    // Fetch business details to include in response
    const businessResult = await db
      .select({
        id: businesses.id,
        businessName: businesses.businessName
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    
    const donationWithBusiness = {
      ...newDonation,
      business: businessResult[0]
    };
    
    return json({
      donation: donationWithBusiness
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating donation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to create donation');
  }
};
