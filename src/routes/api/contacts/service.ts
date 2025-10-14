import { db } from '$lib/server/db';
import { contacts, contactEmails, contactPhoneNumbers, contactAddresses, contactSocialMediaAccounts, contactTags } from '$lib/db/drizzle/schema';
import { eq, and, inArray, or, ilike, sql } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';

export const contactService = {
  async getContacts(workspaceId: string, userId: string, options: {
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
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    // Add search functionality if search query is provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        and(
          eq(contacts.workspaceId, workspaceId),
          or(
            ilike(contacts.firstName, searchTerm),
            ilike(contacts.lastName, searchTerm),
            ilike(contacts.middleName, searchTerm)
          )
        )
      );
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    const contactsList = await query;
    
    // For search results, return minimal data for performance
    if (search && search.trim()) {
      const enhancedContacts = await Promise.all(
        contactsList.map(async (contact) => {
          const emails = await db
            .select()
            .from(contactEmails)
            .where(eq(contactEmails.contactId, contact.id))
            .limit(1);
          
          return {
            ...contact,
            emails: emails || []
          };
        })
      );
      
      return { contacts: enhancedContacts };
    }
    
    // Fetch related data for each contact
    const enhancedContacts = await Promise.all(
      contactsList.map(async (contact) => {
        // Get emails
        const emails = await db
          .select()
          .from(contactEmails)
          .where(eq(contactEmails.contactId, contact.id));
        
        // Get phone numbers
        const phoneNumbers = await db
          .select()
          .from(contactPhoneNumbers)
          .where(eq(contactPhoneNumbers.contactId, contact.id));
        
        // Get addresses
        const addresses = await db
          .select()
          .from(contactAddresses)
          .where(eq(contactAddresses.contactId, contact.id));
        
        // Get social media accounts
        const socialMedia = await db
          .select()
          .from(contactSocialMediaAccounts)
          .where(eq(contactSocialMediaAccounts.contactId, contact.id));
        
        // Get tags
        const tags = await db
          .select()
          .from(contactTags)
          .where(
            and(
              eq(contactTags.contactId, contact.id),
              eq(contactTags.workspaceId, workspaceId)
            )
          );
        
        return {
          ...contact,
          emails,
          phoneNumbers,
          addresses,
          socialMedia,
          tags
        };
      })
    );
    
    return { contacts: enhancedContacts };
  },

  async getContactById(contactId: string, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, contactId),
          eq(contacts.workspaceId, workspaceId)
        )
      );
    
    if (!contact) {
      throw new Error('Contact not found');
    }
    
    // Get related data
    const [emails, phoneNumbers, addresses, socialMedia, tags] = await Promise.all([
      db.select().from(contactEmails).where(eq(contactEmails.contactId, contactId)),
      db.select().from(contactPhoneNumbers).where(eq(contactPhoneNumbers.contactId, contactId)),
      db.select().from(contactAddresses).where(eq(contactAddresses.contactId, contactId)),
      db.select().from(contactSocialMediaAccounts).where(eq(contactSocialMediaAccounts.contactId, contactId)),
      db.select().from(contactTags).where(
        and(
          eq(contactTags.contactId, contactId),
          eq(contactTags.workspaceId, workspaceId)
        )
      )
    ]);
    
    return {
      ...contact,
      emails,
      phoneNumbers,
      addresses,
      socialMedia,
      tags
    };
  },

  async createContact(data: any, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const contactData = {
      ...data,
      workspaceId,
      createdBy: userId
    };
    
    const [newContact] = await db
      .insert(contacts)
      .values(contactData)
      .returning();
    
    return newContact;
  },

  async updateContact(contactId: string, data: any, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    const [updatedContact] = await db
      .update(contacts)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(contacts.id, contactId),
          eq(contacts.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!updatedContact) {
      throw new Error('Contact not found');
    }
    
    return updatedContact;
  },

  async deleteContact(contactId: string, workspaceId: string, userId: string) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }
    
    // Delete related records first
    await Promise.all([
      db.delete(contactEmails).where(eq(contactEmails.contactId, contactId)),
      db.delete(contactPhoneNumbers).where(eq(contactPhoneNumbers.contactId, contactId)),
      db.delete(contactAddresses).where(eq(contactAddresses.contactId, contactId)),
      db.delete(contactSocialMediaAccounts).where(eq(contactSocialMediaAccounts.contactId, contactId)),
      db.delete(contactTags).where(eq(contactTags.contactId, contactId))
    ]);
    
    const [deletedContact] = await db
      .delete(contacts)
      .where(
        and(
          eq(contacts.id, contactId),
          eq(contacts.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!deletedContact) {
      throw new Error('Contact not found');
    }
    
    return { success: true };
  },

  async getContactsPaginated(workspaceId: string, userId: string, options: {
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
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        and(
          eq(contacts.workspaceId, workspaceId),
          or(
            ilike(contacts.firstName, searchTerm),
            ilike(contacts.lastName, searchTerm),
            ilike(contacts.middleName, searchTerm)
          )
        )
      );
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    const total = totalResult[0].count;
    
    // Apply pagination and sorting
    query = query.limit(limit).offset(offset);
    
    const contactsList = await query;
    
    return {
      contacts: contactsList,
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