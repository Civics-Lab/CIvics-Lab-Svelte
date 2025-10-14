import { db } from '$lib/server/db';
import { businesses, businessPhoneNumbers, businessAddresses, businessSocialMediaAccounts, businessEmployees, businessTags, contacts } from '$lib/db/drizzle/schema';
import { eq, and, inArray, or, ilike, sql } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';

export const businessService = {
  async getBusinesses(workspaceId: string, userId: string, options: {
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
    
    const { search, limit = 100, offset = 0 } = options;
    
    // Build the query
    let query = db
      .select()
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));
    
    // Add search functionality if search query is provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        and(
          eq(businesses.workspaceId, workspaceId),
          ilike(businesses.businessName, searchTerm)
        )
      );
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const businessesList = await query;
    
    // For search results, return minimal data for performance
    if (search && search.trim()) {
      const enhancedBusinesses = await Promise.all(
        businessesList.map(async (business) => {
          const addresses = await db
            .select()
            .from(businessAddresses)
            .where(eq(businessAddresses.businessId, business.id))
            .limit(1);
          
          return {
            ...business,
            addresses: addresses || []
          };
        })
      );
      
      return { businesses: enhancedBusinesses };
    }
    
    // Fetch related data for each business
    const enhancedBusinesses = await Promise.all(
      businessesList.map(async (business) => {
        // Get phone numbers
        const phoneNumbers = await db
          .select()
          .from(businessPhoneNumbers)
          .where(eq(businessPhoneNumbers.businessId, business.id));
        
        // Get addresses
        const addresses = await db
          .select()
          .from(businessAddresses)
          .where(eq(businessAddresses.businessId, business.id));
        
        // Get social media accounts
        const socialMedia = await db
          .select()
          .from(businessSocialMediaAccounts)
          .where(eq(businessSocialMediaAccounts.businessId, business.id));
        
        // Get employees
        const employees = await db
          .select({
            businessEmployee: businessEmployees,
            contact: contacts
          })
          .from(businessEmployees)
          .leftJoin(contacts, eq(businessEmployees.contactId, contacts.id))
          .where(eq(businessEmployees.businessId, business.id));
        
        // Get tags
        const tags = await db
          .select()
          .from(businessTags)
          .where(
            and(
              eq(businessTags.businessId, business.id),
              eq(businessTags.workspaceId, workspaceId)
            )
          );
        
        return {
          ...business,
          phoneNumbers,
          addresses,
          socialMedia,
          employees,
          tags
        };
      })
    );
    
    return { businesses: enhancedBusinesses };
  },

  async getBusinessById(businessId: string, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const [business] = await db
      .select()
      .from(businesses)
      .where(
        and(
          eq(businesses.id, businessId),
          eq(businesses.workspaceId, workspaceId)
        )
      );
    
    if (!business) {
      throw new Error('Business not found');
    }
    
    // Get related data
    const [phoneNumbers, addresses, socialMedia, employees, tags] = await Promise.all([
      db.select().from(businessPhoneNumbers).where(eq(businessPhoneNumbers.businessId, businessId)),
      db.select().from(businessAddresses).where(eq(businessAddresses.businessId, businessId)),
      db.select().from(businessSocialMediaAccounts).where(eq(businessSocialMediaAccounts.businessId, businessId)),
      db.select({
        businessEmployee: businessEmployees,
        contact: contacts
      })
      .from(businessEmployees)
      .leftJoin(contacts, eq(businessEmployees.contactId, contacts.id))
      .where(eq(businessEmployees.businessId, businessId)),
      db.select().from(businessTags).where(
        and(
          eq(businessTags.businessId, businessId),
          eq(businessTags.workspaceId, workspaceId)
        )
      )
    ]);
    
    return {
      ...business,
      phoneNumbers,
      addresses,
      socialMedia,
      employees,
      tags
    };
  },

  async createBusiness(data: any, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const businessData = {
      ...data,
      workspaceId,
      createdBy: userId
    };
    
    const [newBusiness] = await db
      .insert(businesses)
      .values(businessData)
      .returning();
    
    return newBusiness;
  },

  async updateBusiness(businessId: string, data: any, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const [updatedBusiness] = await db
      .update(businesses)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(businesses.id, businessId),
          eq(businesses.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!updatedBusiness) {
      throw new Error('Business not found');
    }
    
    return updatedBusiness;
  },

  async deleteBusiness(businessId: string, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // Delete related records first
    await Promise.all([
      db.delete(businessPhoneNumbers).where(eq(businessPhoneNumbers.businessId, businessId)),
      db.delete(businessAddresses).where(eq(businessAddresses.businessId, businessId)),
      db.delete(businessSocialMediaAccounts).where(eq(businessSocialMediaAccounts.businessId, businessId)),
      db.delete(businessEmployees).where(eq(businessEmployees.businessId, businessId)),
      db.delete(businessTags).where(eq(businessTags.businessId, businessId))
    ]);
    
    const [deletedBusiness] = await db
      .delete(businesses)
      .where(
        and(
          eq(businesses.id, businessId),
          eq(businesses.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!deletedBusiness) {
      throw new Error('Business not found');
    }
    
    return { success: true };
  },

  async getBusinessesPaginated(workspaceId: string, userId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;
    
    // Build base query
    let query = db
      .select()
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));
    
    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        and(
          eq(businesses.workspaceId, workspaceId),
          ilike(businesses.businessName, searchTerm)
        )
      );
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));
    
    const total = totalResult[0].count;
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    const businessesList = await query;
    
    return {
      businesses: businessesList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
};