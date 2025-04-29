import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { donations, contacts, businesses, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, desc, and, inArray, or, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { v4 as uuidv4 } from 'uuid';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/donations?workspace_id=[workspace_id] - Get all donations for a workspace
export const GET: RequestHandler = async ({ url, locals }) => {
  const workspaceId = url.searchParams.get('workspace_id');
  
  // Verify workspace access
  await verifyWorkspaceAccess(locals.user, workspaceId);
  
  try {
    // First get contacts in this workspace
    const workspaceContacts = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    // Then get businesses in this workspace
    const workspaceBusinesses = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));
    
    // Extract IDs for filtering
    const contactIds = workspaceContacts.map(c => c.id);
    const businessIds = workspaceBusinesses.map(b => b.id);
    
    // If there are no contacts or businesses in this workspace, return empty results
    if (contactIds.length === 0 && businessIds.length === 0) {
      return json({ donations: [] });
    }
    
    // Fetch donations for contacts and businesses in this workspace
    let donationQuery;
    
    if (contactIds.length > 0 && businessIds.length > 0) {
      // Fetch donations for both contacts and businesses
      donationQuery = db
        .select()
        .from(donations)
        .where(
          or(
            and(
              inArray(donations.contactId, contactIds),
              isNull(donations.businessId)
            ),
            and(
              inArray(donations.businessId, businessIds),
              isNull(donations.contactId)
            )
          )
        )
        .orderBy(desc(donations.createdAt));
    } else if (contactIds.length > 0) {
      // Only fetch donations for contacts
      donationQuery = db
        .select()
        .from(donations)
        .where(inArray(donations.contactId, contactIds))
        .orderBy(desc(donations.createdAt));
    } else {
      // Only fetch donations for businesses
      donationQuery = db
        .select()
        .from(donations)
        .where(inArray(donations.businessId, businessIds))
        .orderBy(desc(donations.createdAt));
    }
    
    const donationResults = await donationQuery;
    
    // For each donation, fetch the associated contact or business
    const donationsWithDetails = await Promise.all(
      donationResults.map(async (donation) => {
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
        
        return {
          ...donation,
          ...donorDetails
        };
      })
    );
    
    return json({
      donations: donationsWithDetails
    });
  } catch (err) {
    console.error('Error fetching donations:', err);
    throw error(500, 'Failed to fetch donations');
  }
};

// POST /api/donations - Create a new donation
export const POST: RequestHandler = async ({ request, locals }) => {
  // Parse request body
  const requestData = await request.json();
  
  // Validate required fields and data types
  if (!requestData.amount || isNaN(Number(requestData.amount))) {
    throw error(400, 'Valid amount is required');
  }
  
  if (!requestData.contactId && !requestData.businessId) {
    throw error(400, 'Either contactId or businessId is required');
  }
  
  if (requestData.contactId && requestData.businessId) {
    throw error(400, 'Only one of contactId or businessId should be provided');
  }
  
  try {
    // Check authentication
    const user = locals.user;
    
    if (!user) {
      throw error(401, 'Authentication required');
    }
    
    // Check access to the contact or business
    let resourceWorkspaceId;
    
    if (requestData.contactId) {
      const contact = await db
        .select({
          id: contacts.id,
          workspaceId: contacts.workspaceId
        })
        .from(contacts)
        .where(eq(contacts.id, requestData.contactId))
        .limit(1);
      
      if (!contact || contact.length === 0) {
        throw error(404, 'Contact not found');
      }
      
      resourceWorkspaceId = contact[0].workspaceId;
    } else if (requestData.businessId) {
      const business = await db
        .select({
          id: businesses.id,
          workspaceId: businesses.workspaceId
        })
        .from(businesses)
        .where(eq(businesses.id, requestData.businessId))
        .limit(1);
      
      if (!business || business.length === 0) {
        throw error(404, 'Business not found');
      }
      
      resourceWorkspaceId = business[0].workspaceId;
    }
    
    // Verify workspace access
    await verifyWorkspaceAccess(locals.user, resourceWorkspaceId);
    
    // Prepare data for insertion
    const newDonation = {
      id: uuidv4(),
      amount: Number(requestData.amount),
      contactId: requestData.contactId || null,
      businessId: requestData.businessId || null,
      status: requestData.status || 'promise',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the donation
    const [createdDonation] = await db
      .insert(donations)
      .values(newDonation)
      .returning();
    
    return json({
      donation: createdDonation
    });
  } catch (err) {
    console.error('Error creating donation:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to create donation');
  }
};
