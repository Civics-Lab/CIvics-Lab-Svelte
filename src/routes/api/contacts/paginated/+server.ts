// src/routes/api/contacts/paginated/+server.ts
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contacts, contactEmails, contactPhoneNumbers, contactAddresses, contactSocialMediaAccounts, contactTags } from '$lib/db/drizzle/schema';
import { eq, and, inArray, or, ilike, gt, lt, gte, lte, ne, desc, asc, count } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Extract pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '100');
    const workspaceId = url.searchParams.get('workspace_id');
    const search = url.searchParams.get('search') || '';
    const filters = url.searchParams.get('filters') ? JSON.parse(url.searchParams.get('filters')!) : [];
    const sorting = url.searchParams.get('sorting') ? JSON.parse(url.searchParams.get('sorting')!) : [];

    console.log('Paginated contacts API called with:', {
      page,
      pageSize,
      workspaceId,
      search,
      filters,
      sorting
    });

    if (!workspaceId) {
      throw error(400, 'Workspace ID is required');
    }

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 1000) {
      throw error(400, 'Invalid pagination parameters');
    }

    // Verify workspace access
    await verifyWorkspaceAccess(locals.user, workspaceId);

    // Build the base where conditions
    const whereConditions = [eq(contacts.workspaceId, workspaceId)];

    // Apply search to main contact fields
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push(
        or(
          ilike(contacts.firstName, searchTerm),
          ilike(contacts.lastName, searchTerm),
          ilike(contacts.middleName, searchTerm),
          ilike(contacts.vanid, searchTerm)
        )
      );
    }

    // Apply filters
    filters.forEach((filter: any) => {
      if (filter.field && filter.operator && filter.value !== undefined && filter.value !== '') {
        const fieldValue = filter.value;
        
        // Map field names to actual database columns
        let dbField;
        switch (filter.field) {
          case 'firstName':
            dbField = contacts.firstName;
            break;
          case 'lastName':
            dbField = contacts.lastName;
            break;
          case 'middleName':
            dbField = contacts.middleName;
            break;
          case 'gender':
            dbField = contacts.genderId;
            break;
          case 'race':
            dbField = contacts.raceId;
            break;
          case 'pronouns':
            dbField = contacts.pronouns;
            break;
          case 'vanid':
            dbField = contacts.vanid;
            break;
          default:
            console.warn(`Unknown filter field: ${filter.field}`);
            return; // Skip this filter
        }
        
        switch (filter.operator) {
          case '=':
            whereConditions.push(eq(dbField, fieldValue));
            break;
          case '!=':
            whereConditions.push(ne(dbField, fieldValue));
            break;
          case 'contains':
            whereConditions.push(ilike(dbField, `%${fieldValue}%`));
            break;
          case 'startsWith':
            whereConditions.push(ilike(dbField, `${fieldValue}%`));
            break;
          case 'endsWith':
            whereConditions.push(ilike(dbField, `%${fieldValue}`));
            break;
          case '>':
            whereConditions.push(gt(dbField, fieldValue));
            break;
          case '<':
            whereConditions.push(lt(dbField, fieldValue));
            break;
          case '>=':
            whereConditions.push(gte(dbField, fieldValue));
            break;
          case '<=':
            whereConditions.push(lte(dbField, fieldValue));
            break;
        }
      }
    });

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(...whereConditions));
    
    const totalRecords = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const offset = (page - 1) * pageSize;

    // Build the main query
    let query = db
      .select()
      .from(contacts)
      .where(and(...whereConditions));

    // Apply sorting
    if (sorting.length > 0) {
      console.log('Applying server-side sorting:', sorting);
      const orderByClauses = sorting.map((sort: any) => {
        if (sort.field && sort.direction) {
          // Map field names to actual database columns
          let dbField;
          switch (sort.field) {
            case 'firstName':
              dbField = contacts.firstName;
              break;
            case 'lastName':
              dbField = contacts.lastName;
              break;
            case 'middleName':
              dbField = contacts.middleName;
              break;
            case 'gender':
              dbField = contacts.genderId;
              break;
            case 'race':
              dbField = contacts.raceId;
              break;
            case 'pronouns':
              dbField = contacts.pronouns;
              break;
            case 'vanid':
              dbField = contacts.vanid;
              break;
            default:
              console.warn(`Unknown sort field: ${sort.field}`);
              return null;
          }
          
          console.log(`Sorting by ${sort.field} (${sort.direction})`);
          return sort.direction === 'asc' 
            ? asc(dbField)
            : desc(dbField);
        }
        return null;
      }).filter(Boolean);
      
      if (orderByClauses.length > 0) {
        console.log('Applied', orderByClauses.length, 'sort clauses');
        query = query.orderBy(...orderByClauses);
      }
    } else {
      // Default sorting by last name, then first name
      console.log('Using default sorting: lastName ASC, firstName ASC');
      query = query.orderBy(asc(contacts.lastName), asc(contacts.firstName));
    }

    // Apply pagination
    query = query.limit(pageSize).offset(offset);

    // Execute the main query
    const contactsList = await query;

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
          emails: emails || [],
          phoneNumbers: phoneNumbers || [],
          addresses: addresses || [],
          socialMediaAccounts: socialMedia || [],
          tags: tags || [],
        };
      })
    );

    const responseData = {
      contacts: enhancedContacts,
      pagination: {
        currentPage: page,
        pageSize,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };

    console.log('Returning paginated response:', {
      contactsCount: enhancedContacts.length,
      pagination: responseData.pagination
    });

    return json(responseData);

  } catch (err) {
    console.error('Error in paginated contacts API:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch paginated contacts');
  }
};
