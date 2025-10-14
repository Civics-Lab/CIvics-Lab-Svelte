import { db } from '$lib/server/db';
import { donations, contacts, businesses, userWorkspaces, donationTags } from '$lib/db/drizzle/schema';
import { eq, desc, and, inArray, or, isNull, ilike, sql } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import { v4 as uuidv4 } from 'uuid';

export const donationService = {
  async getDonations(workspaceId: string, userId: string, options: {
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

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
      return { donations: [] };
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

    // Apply pagination
    const { limit = 100, offset = 0 } = options;
    donationQuery = donationQuery.limit(limit).offset(offset);
    
    const donationResults = await donationQuery;
    
    // For each donation, fetch the associated contact or business and add donor info
    const donationsWithDetails = await Promise.all(
      donationResults.map(async (donation) => {
        let donorDetails = {};
        let donorName = 'Unknown';
        let donorType = 'Unknown';
        
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
            const contact = contactResult[0];
            donorName = `${contact.firstName} ${contact.lastName}`.trim();
            donorType = 'Contact';
            donorDetails = { contact };
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
            const business = businessResult[0];
            donorName = business.businessName;
            donorType = 'Business';
            donorDetails = { business };
          }
        }
        
        return {
          ...donation,
          donorName,
          donorType,
          ...donorDetails
        };
      })
    );
    
    return { donations: donationsWithDetails };
  },

  async getDonationById(donationId: string, userId: string) {
    // Check access and get donation
    const donation = await this.checkDonationAccess(userId, donationId);
    
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
    
    return {
      ...donation,
      ...donorDetails,
      tags: tags || []
    };
  },

  async createDonation(data: any, userId: string) {
    // Validate required fields
    if (!data.amount || isNaN(Number(data.amount))) {
      throw new Error('Valid amount is required');
    }
    
    if (!data.contactId && !data.businessId) {
      throw new Error('Either contactId or businessId is required');
    }
    
    if (data.contactId && data.businessId) {
      throw new Error('Only one of contactId or businessId should be provided');
    }

    // Check access to the contact or business
    let resourceWorkspaceId;
    
    if (data.contactId) {
      const contact = await db
        .select({
          id: contacts.id,
          workspaceId: contacts.workspaceId
        })
        .from(contacts)
        .where(eq(contacts.id, data.contactId))
        .limit(1);
      
      if (!contact || contact.length === 0) {
        throw new Error('Contact not found');
      }
      
      resourceWorkspaceId = contact[0].workspaceId;
    } else if (data.businessId) {
      const business = await db
        .select({
          id: businesses.id,
          workspaceId: businesses.workspaceId
        })
        .from(businesses)
        .where(eq(businesses.id, data.businessId))
        .limit(1);
      
      if (!business || business.length === 0) {
        throw new Error('Business not found');
      }
      
      resourceWorkspaceId = business[0].workspaceId;
    }
    
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(resourceWorkspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // Prepare data for insertion
    const newDonation = {
      id: uuidv4(),
      amount: Number(data.amount),
      contactId: data.contactId || null,
      businessId: data.businessId || null,
      status: data.status || 'promise',
      paymentType: data.paymentType || null,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the donation
    const [createdDonation] = await db
      .insert(donations)
      .values(newDonation)
      .returning();
    
    return createdDonation;
  },

  async updateDonation(donationId: string, data: any, userId: string) {
    // Check access and get donation
    const donation = await this.checkDonationAccess(userId, donationId);
    
    const { donationData, tags } = data;
    
    if (!donationData) {
      throw new Error('Donation data is required');
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
    
    // Handle donor changes (contact/business transfer)
    const newContactId = donationData.contactId;
    const newBusinessId = donationData.businessId;
    
    // Check if donor is changing
    const isDonorChanging = (
      (newContactId !== undefined && newContactId !== donation.contactId) ||
      (newBusinessId !== undefined && newBusinessId !== donation.businessId)
    );
    
    if (isDonorChanging) {
      // Verify access to new donor if specified
      if (newContactId || newBusinessId) {
        await this.verifyNewDonorAccess(userId, newContactId, newBusinessId);
      }
      
      // Update donor fields
      if (newContactId !== undefined) {
        updateFields.contactId = newContactId;
        updateFields.businessId = null; // Clear business if setting contact
      } else if (newBusinessId !== undefined) {
        updateFields.businessId = newBusinessId;
        updateFields.contactId = null; // Clear contact if setting business
      } else {
        // Both are null - remove donor association
        updateFields.contactId = null;
        updateFields.businessId = null;
      }
    }
    
    // Only update if there's data to update
    if (Object.keys(updateFields).length === 0 && !tags) {
      throw new Error('No valid fields to update');
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
    
    return {
      ...updatedDonation,
      ...donorDetails,
      tags: updatedTags || []
    };
  },

  async deleteDonation(donationId: string, userId: string) {
    // Check access
    await this.checkDonationAccess(userId, donationId);
    
    // Delete tags first (though onDelete cascade should handle this, we do it explicitly)
    await db
      .delete(donationTags)
      .where(eq(donationTags.donationId, donationId));
    
    // Delete the donation
    await db
      .delete(donations)
      .where(eq(donations.id, donationId));
    
    return { success: true };
  },

  async getDonationsPaginated(workspaceId: string, userId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: any[];
    sorting?: any[];
  } = {}) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    const { page = 1, limit = 10, search, filters = [], sorting = [] } = options;
    const offset = (page - 1) * limit;

    // Get workspace contacts and businesses for filtering
    const workspaceContacts = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    const workspaceBusinesses = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));
    
    const contactIds = workspaceContacts.map(c => c.id);
    const businessIds = workspaceBusinesses.map(b => b.id);
    
    if (contactIds.length === 0 && businessIds.length === 0) {
      return {
        donations: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      };
    }

    // Build base query
    let baseWhere;
    if (contactIds.length > 0 && businessIds.length > 0) {
      baseWhere = or(
        and(
          inArray(donations.contactId, contactIds),
          isNull(donations.businessId)
        ),
        and(
          inArray(donations.businessId, businessIds),
          isNull(donations.contactId)
        )
      );
    } else if (contactIds.length > 0) {
      baseWhere = inArray(donations.contactId, contactIds);
    } else {
      baseWhere = inArray(donations.businessId, businessIds);
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(donations)
      .where(baseWhere);
    
    const total = totalResult[0].count;

    // Build query with pagination
    let query = db
      .select()
      .from(donations)
      .where(baseWhere)
      .limit(limit)
      .offset(offset);

    // Apply sorting
    if (sorting.length > 0) {
      // Apply sorting logic here
      query = query.orderBy(desc(donations.createdAt));
    } else {
      query = query.orderBy(desc(donations.createdAt));
    }

    const donationResults = await query;

    return {
      donations: donationResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  },

  // Helper function to check access to donation
  async checkDonationAccess(userId: string, donationId: string) {
    // Get donation
    const donation = await db
      .select()
      .from(donations)
      .where(eq(donations.id, donationId))
      .limit(1);
    
    if (!donation || donation.length === 0) {
      throw new Error('Donation not found');
    }
    
    // If it's a contact donation, check access to the contact's workspace
    if (donation[0].contactId) {
      const contact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, donation[0].contactId))
        .limit(1);
      
      if (!contact || contact.length === 0) {
        throw new Error('Contact not found');
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
        throw new Error('You do not have access to this donation');
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
        throw new Error('Business not found');
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
        throw new Error('You do not have access to this donation');
      }
    }
    
    return donation[0];
  },

  // Helper function to verify access to new donor (contact or business)
  async verifyNewDonorAccess(userId: string, contactId?: string, businessId?: string) {
    if (contactId && businessId) {
      throw new Error('Cannot specify both contactId and businessId');
    }
    
    if (contactId) {
      const contact = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1);
      
      if (!contact || contact.length === 0) {
        throw new Error('Contact not found');
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
        throw new Error('You do not have access to this contact');
      }
      
      return { contact: contact[0] };
    }
    
    if (businessId) {
      const business = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, businessId))
        .limit(1);
      
      if (!business || business.length === 0) {
        throw new Error('Business not found');
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
        throw new Error('You do not have access to this business');
      }
      
      return { business: business[0] };
    }
    
    return null;
  }
};