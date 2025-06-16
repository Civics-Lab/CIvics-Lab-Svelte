// src/routes/api/businesses/paginated/+server.ts
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { businesses, businessPhoneNumbers, businessAddresses, businessSocialMediaAccounts, businessEmployees, businessTags, contacts, zipCodes } from '$lib/db/drizzle/schema';
import { eq, and, or, ilike, gt, lt, gte, lte, ne, desc, asc, count, exists } from 'drizzle-orm';
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

    console.log('Paginated businesses API called with:', {
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
    const whereConditions = [eq(businesses.workspaceId, workspaceId)];

    // Apply search to main business fields and related data
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push(
        or(
          ilike(businesses.businessName, searchTerm),
          ilike(businesses.status, searchTerm),
          // Search in addresses
          exists(
            db.select()
              .from(businessAddresses)
              .where(
                and(
                  eq(businessAddresses.businessId, businesses.id),
                  or(
                    ilike(businessAddresses.streetAddress, searchTerm),
                    ilike(businessAddresses.city, searchTerm),
                    ilike(businessAddresses.secondaryStreetAddress, searchTerm)
                  )
                )
              )
          ),
          // Search in phone numbers
          exists(
            db.select()
              .from(businessPhoneNumbers)
              .where(
                and(
                  eq(businessPhoneNumbers.businessId, businesses.id),
                  ilike(businessPhoneNumbers.phoneNumber, searchTerm)
                )
              )
          ),
          // Search in social media accounts
          exists(
            db.select()
              .from(businessSocialMediaAccounts)
              .where(
                and(
                  eq(businessSocialMediaAccounts.businessId, businesses.id),
                  ilike(businessSocialMediaAccounts.socialMediaAccount, searchTerm)
                )
              )
          ),
          // Search in tags
          exists(
            db.select()
              .from(businessTags)
              .where(
                and(
                  eq(businessTags.businessId, businesses.id),
                  ilike(businessTags.tag, searchTerm)
                )
              )
          )
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
          case 'businessName':
            dbField = businesses.businessName;
            break;
          case 'status':
            dbField = businesses.status;
            break;
          case 'createdAt':
            dbField = businesses.createdAt;
            break;
          case 'updatedAt':
            dbField = businesses.updatedAt;
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
      .from(businesses)
      .where(and(...whereConditions));
    
    const totalRecords = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const offset = (page - 1) * pageSize;

    // Build the main query
    let query = db
      .select()
      .from(businesses)
      .where(and(...whereConditions));

    // Apply sorting
    if (sorting.length > 0) {
      console.log('Applying server-side sorting:', sorting);
      const orderByClauses = sorting.map((sort: any) => {
        if (sort.field && sort.direction) {
          // Map field names to actual database columns
          let dbField;
          switch (sort.field) {
            case 'businessName':
              dbField = businesses.businessName;
              break;
            case 'status':
              dbField = businesses.status;
              break;
            case 'createdAt':
              dbField = businesses.createdAt;
              break;
            case 'updatedAt':
              dbField = businesses.updatedAt;
              break;
            default:
              console.warn(`Unknown sort field: ${sort.field}`);
              return null;
          }
          
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
      // Default sorting by business name
      console.log('Using default sorting: businessName ASC');
      query = query.orderBy(asc(businesses.businessName));
    }

    // Apply pagination
    query = query.limit(pageSize).offset(offset);

    // Execute the main query
    const businessesList = await query;

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
        
        // Get employees with contact details
        const employees = await db
          .select({
            id: businessEmployees.id,
            businessId: businessEmployees.businessId,
            contactId: businessEmployees.contactId,
            status: businessEmployees.status,
            createdAt: businessEmployees.createdAt,
            updatedAt: businessEmployees.updatedAt,
            contactFirstName: contacts.firstName,
            contactLastName: contacts.lastName
          })
          .from(businessEmployees)
          .leftJoin(contacts, eq(businessEmployees.contactId, contacts.id))
          .where(eq(businessEmployees.businessId, business.id));
        
        // Transform the employees data
        const employeesWithContactNames = employees.map(employee => ({
          id: employee.id,
          businessId: employee.businessId,
          contactId: employee.contactId,
          status: employee.status,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
          contactName: employee.contactFirstName && employee.contactLastName ? 
            `${employee.contactFirstName} ${employee.contactLastName}` : 'Unknown Contact'
        }));
        
        // Get tags
        const tags = await db
          .select()
          .from(businessTags)
          .where(eq(businessTags.businessId, business.id));
        
        return {
          ...business,
          phoneNumbers: phoneNumbers || [],
          addresses: addresses || [],
          socialMediaAccounts: socialMedia || [],
          employees: employeesWithContactNames || [],
          tags: tags || [],
        };
      })
    );

    const responseData = {
      businesses: enhancedBusinesses,
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
      businessesCount: enhancedBusinesses.length,
      pagination: responseData.pagination
    });

    return json(responseData);

  } catch (err) {
    console.error('Error in paginated businesses API:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch paginated businesses');
  }
};