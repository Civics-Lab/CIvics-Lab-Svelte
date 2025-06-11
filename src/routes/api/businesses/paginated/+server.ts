// src/routes/api/businesses/paginated/+server.ts
import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { businesses, businessPhoneNumbers, businessAddresses, businessSocialMediaAccounts, businessEmployees, businessTags, contacts } from '$lib/db/drizzle/schema';
import { eq, and, or, ilike, asc, desc, count, not } from 'drizzle-orm';
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

    if (!workspaceId) {
      throw error(400, 'Workspace ID is required');
    }

    // Verify workspace access
    await verifyWorkspaceAccess(locals.user, workspaceId);

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 1000) {
      throw error(400, 'Invalid pagination parameters');
    }

    const offset = (page - 1) * pageSize;

    // Build base where conditions
    let whereConditions = [eq(businesses.workspaceId, workspaceId)];

    // Apply search
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push(
        ilike(businesses.businessName, searchTerm)
      );
    }

    // Apply filters
    filters.forEach((filter: any) => {
      if (filter.field && filter.operator && filter.value) {
        const filterValue = filter.value;
        
        switch (filter.field) {
          case 'businessName':
            switch (filter.operator) {
              case '=':
                whereConditions.push(eq(businesses.businessName, filterValue));
                break;
              case '!=':
                whereConditions.push(not(eq(businesses.businessName, filterValue)));
                break;
              case 'contains':
                whereConditions.push(ilike(businesses.businessName, `%${filterValue}%`));
                break;
              case 'startsWith':
                whereConditions.push(ilike(businesses.businessName, `${filterValue}%`));
                break;
              case 'endsWith':
                whereConditions.push(ilike(businesses.businessName, `%${filterValue}`));
                break;
            }
            break;
          // Add more fields as needed
        }
      }
    });

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(businesses)
      .where(and(...whereConditions));
    
    const totalRecords = totalResult.count;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Build the main query with sorting
    let query = db
      .select()
      .from(businesses)
      .where(and(...whereConditions));

    // Apply sorting
    if (sorting.length > 0) {
      const orderBy: any[] = [];
      sorting.forEach((sort: any) => {
        if (sort.field && sort.direction) {
          switch (sort.field) {
            case 'businessName':
              orderBy.push(sort.direction === 'asc' ? asc(businesses.businessName) : desc(businesses.businessName));
              break;
            // Add more sortable fields as needed
          }
        }
      });
      if (orderBy.length > 0) {
        query = query.orderBy(...orderBy);
      }
    } else {
      // Default sorting
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
          tags: tags || []
        };
      })
    );

    return json({
      businesses: enhancedBusinesses,
      pagination: {
        currentPage: page,
        pageSize,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (err) {
    console.error('Error in paginated businesses API:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Internal server error');
  }
};