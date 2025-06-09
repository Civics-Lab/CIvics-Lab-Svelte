import { db } from '$lib/server/db';
import { 
  contacts, 
  businesses, 
  donations, 
  contactEmails, 
  businessPhoneNumbers,
  contactPhoneNumbers 
} from '$lib/db/drizzle/schema';
import { eq, and, or, ilike, inArray } from 'drizzle-orm';

export class DuplicateDetector {
  /**
   * Find potential duplicates for import data
   */
  static async findDuplicates(
    importType: string,
    data: any[],
    workspaceId: string,
    duplicateField: string
  ): Promise<Array<{ row: any; rowNumber: number; duplicates: any[] }>> {
    const results: Array<{ row: any; rowNumber: number; duplicates: any[] }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const duplicates = await this.searchForDuplicates(
        importType,
        row,
        workspaceId,
        duplicateField
      );
      
      if (duplicates.length > 0) {
        results.push({ row, rowNumber: i + 1, duplicates });
      }
    }

    return results;
  }

  /**
   * Search for duplicates based on import type and field
   */
  private static async searchForDuplicates(
    importType: string,
    row: any,
    workspaceId: string,
    duplicateField: string
  ): Promise<any[]> {
    const searchValue = row[duplicateField];
    if (!searchValue) return [];

    switch (importType) {
      case 'contacts':
        return this.findContactDuplicates(searchValue, duplicateField, workspaceId);
      case 'businesses':
        return this.findBusinessDuplicates(searchValue, duplicateField, workspaceId);
      case 'donations':
        return this.findDonationDuplicates(row, workspaceId);
      default:
        return [];
    }
  }

  /**
   * Find contact duplicates
   */
  private static async findContactDuplicates(
    searchValue: string,
    field: string,
    workspaceId: string
  ): Promise<any[]> {
    try {
      switch (field) {
        case 'emails':
          return this.findContactsByEmail(searchValue, workspaceId);
        case 'phoneNumbers':
          return this.findContactsByPhone(searchValue, workspaceId);
        case 'vanid':
          return this.findContactsByVanId(searchValue, workspaceId);
        default:
          return this.findContactsByName(searchValue, field, workspaceId);
      }
    } catch (error) {
      console.error('Error finding contact duplicates:', error);
      return [];
    }
  }

  /**
   * Find contacts by email
   */
  private static async findContactsByEmail(
    email: string,
    workspaceId: string
  ): Promise<any[]> {
    const emails = email.split(',').map(e => e.trim());
    
    const results = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contactEmails.email
      })
      .from(contacts)
      .innerJoin(contactEmails, eq(contacts.id, contactEmails.contactId))
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          inArray(contactEmails.email, emails)
        )
      );
    
    return results;
  }

  /**
   * Find contacts by phone number
   */
  private static async findContactsByPhone(
    phone: string,
    workspaceId: string
  ): Promise<any[]> {
    const phones = phone.split(',').map(p => p.trim());
    
    const results = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        phone: contactPhoneNumbers.phoneNumber
      })
      .from(contacts)
      .innerJoin(contactPhoneNumbers, eq(contacts.id, contactPhoneNumbers.contactId))
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          inArray(contactPhoneNumbers.phoneNumber, phones)
        )
      );
    
    return results;
  }

  /**
   * Find contacts by VAN ID
   */
  private static async findContactsByVanId(
    vanid: string,
    workspaceId: string
  ): Promise<any[]> {
    const results = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        vanid: contacts.vanid
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.workspaceId, workspaceId),
          eq(contacts.vanid, vanid)
        )
      );
    
    return results;
  }

  /**
   * Find contacts by name
   */
  private static async findContactsByName(
    searchValue: string,
    field: string,
    workspaceId: string
  ): Promise<any[]> {
    const searchTerm = `%${searchValue}%`;
    
    let whereClause;
    if (field === 'firstName') {
      whereClause = and(
        eq(contacts.workspaceId, workspaceId),
        ilike(contacts.firstName, searchTerm)
      );
    } else if (field === 'lastName') {
      whereClause = and(
        eq(contacts.workspaceId, workspaceId),
        ilike(contacts.lastName, searchTerm)
      );
    } else {
      // Search both first and last names
      whereClause = and(
        eq(contacts.workspaceId, workspaceId),
        or(
          ilike(contacts.firstName, searchTerm),
          ilike(contacts.lastName, searchTerm)
        )
      );
    }

    const results = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName
      })
      .from(contacts)
      .where(whereClause);
    
    return results;
  }

  /**
   * Find business duplicates
   */
  private static async findBusinessDuplicates(
    searchValue: string,
    field: string,
    workspaceId: string
  ): Promise<any[]> {
    try {
      switch (field) {
        case 'businessName':
          return this.findBusinessesByName(searchValue, workspaceId);
        case 'phoneNumbers':
          return this.findBusinessesByPhone(searchValue, workspaceId);
        default:
          return [];
      }
    } catch (error) {
      console.error('Error finding business duplicates:', error);
      return [];
    }
  }

  /**
   * Find businesses by name
   */
  private static async findBusinessesByName(
    businessName: string,
    workspaceId: string
  ): Promise<any[]> {
    const searchTerm = `%${businessName}%`;
    
    const results = await db
      .select({
        id: businesses.id,
        businessName: businesses.businessName
      })
      .from(businesses)
      .where(
        and(
          eq(businesses.workspaceId, workspaceId),
          ilike(businesses.businessName, searchTerm)
        )
      );
    
    return results;
  }

  /**
   * Find businesses by phone number
   */
  private static async findBusinessesByPhone(
    phone: string,
    workspaceId: string
  ): Promise<any[]> {
    const phones = phone.split(',').map(p => p.trim());
    
    const results = await db
      .select({
        id: businesses.id,
        businessName: businesses.businessName,
        phone: businessPhoneNumbers.phoneNumber
      })
      .from(businesses)
      .innerJoin(businessPhoneNumbers, eq(businesses.id, businessPhoneNumbers.businessId))
      .where(
        and(
          eq(businesses.workspaceId, workspaceId),
          inArray(businessPhoneNumbers.phoneNumber, phones)
        )
      );
    
    return results;
  }

  /**
   * Find donation duplicates
   */
  private static async findDonationDuplicates(
    row: any,
    workspaceId: string
  ): Promise<any[]> {
    try {
      let whereConditions = [];
      
      // Check for exact amount match
      if (row.amount) {
        whereConditions.push(eq(donations.amount, parseFloat(row.amount)));
      }

      // Check for contact or business match
      if (row.contactId) {
        whereConditions.push(eq(donations.contactId, row.contactId));
      }
      
      if (row.businessId) {
        whereConditions.push(eq(donations.businessId, row.businessId));
      }

      if (whereConditions.length === 0) {
        return [];
      }

      // First get contacts and businesses in this workspace
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
        return [];
      }

      // Find donations in this workspace that match criteria
      const results = await db
        .select({
          id: donations.id,
          amount: donations.amount,
          contactId: donations.contactId,
          businessId: donations.businessId,
          status: donations.status
        })
        .from(donations)
        .where(
          and(
            ...whereConditions,
            or(
              contactIds.length > 0 ? inArray(donations.contactId, contactIds) : undefined,
              businessIds.length > 0 ? inArray(donations.businessId, businessIds) : undefined
            )
          )
        );
      
      return results;
    } catch (error) {
      console.error('Error finding donation duplicates:', error);
      return [];
    }
  }

  /**
   * Find related entities (contacts, businesses) for donation imports
   */
  static async findRelatedEntities(
    importType: string,
    row: any,
    workspaceId: string
  ): Promise<{ contacts: any[]; businesses: any[] }> {
    let relatedContacts: any[] = [];
    let relatedBusinesses: any[] = [];

    if (importType === 'donations') {
      // Find contact by email or name
      if (row.donorEmail) {
        relatedContacts = await this.findContactsByEmail(row.donorEmail, workspaceId);
      } else if (row.donorName) {
        const [firstName, ...lastNameParts] = row.donorName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        if (firstName && lastName) {
          relatedContacts = await db
            .select({
              id: contacts.id,
              firstName: contacts.firstName,
              lastName: contacts.lastName
            })
            .from(contacts)
            .where(
              and(
                eq(contacts.workspaceId, workspaceId),
                ilike(contacts.firstName, `%${firstName}%`),
                ilike(contacts.lastName, `%${lastName}%`)
              )
            );
        }
      }

      // Find business by name
      if (row.businessName) {
        relatedBusinesses = await this.findBusinessesByName(row.businessName, workspaceId);
      }
    }

    return { contacts: relatedContacts, businesses: relatedBusinesses };
  }

  /**
   * Calculate duplicate confidence score
   */
  static calculateDuplicateScore(
    importRow: any,
    existingRecord: any,
    matchFields: string[]
  ): number {
    let score = 0;
    let totalFields = matchFields.length;

    matchFields.forEach(field => {
      const importValue = importRow[field];
      const existingValue = existingRecord[field];

      if (importValue && existingValue) {
        if (field === 'emails' || field === 'phoneNumbers') {
          // For multi-value fields, check if any values match
          const importValues = importValue.split(',').map((v: string) => v.trim());
          const existingValues = existingValue.split(',').map((v: string) => v.trim());
          
          const hasMatch = importValues.some((iv: string) => 
            existingValues.some((ev: string) => 
              iv.toLowerCase() === ev.toLowerCase()
            )
          );
          
          if (hasMatch) score += 1;
        } else {
          // Exact match
          if (importValue.toLowerCase() === existingValue.toLowerCase()) {
            score += 1;
          }
          // Partial match
          else if (importValue.toLowerCase().includes(existingValue.toLowerCase()) ||
                   existingValue.toLowerCase().includes(importValue.toLowerCase())) {
            score += 0.5;
          }
        }
      }
    });

    return (score / totalFields) * 100;
  }
}
