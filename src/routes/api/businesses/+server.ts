import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { businesses, userWorkspaces, businessPhoneNumbers, businessAddresses, businessSocialMediaAccounts, businessEmployees, businessTags, zipCodes, contacts } from '$lib/db/drizzle/schema';
import { eq, and, inArray, or, ilike } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// GET /api/businesses - Get all businesses for the current user's workspace (with optional search)
export const GET: RequestHandler = async ({ locals, url }) => {
  try {
    const workspaceId = url.searchParams.get('workspace_id');
    const searchQuery = url.searchParams.get('search');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100; // Default limit of 100
    
    // Verify workspace access
    await verifyWorkspaceAccess(locals.user, workspaceId);
    
    // Build the query
    let query = db
      .select()
      .from(businesses)
      .where(eq(businesses.workspaceId, workspaceId));
    
    // Add search functionality if search query is provided
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = `%${searchQuery.trim()}%`;
      query = query.where(
        and(
          eq(businesses.workspaceId, workspaceId),
          ilike(businesses.businessName, searchTerm)
        )
      );
    }
    
    // Apply limit
    query = query.limit(limit);
    
    // Execute the query
    const businessesList = await query;
    
    // For search results, return minimal data for performance
    if (searchQuery && searchQuery.trim()) {
      // For search, return basic business info plus first address for display
      const enhancedBusinesses = await Promise.all(
        businessesList.map(async (business) => {
          // Get only the first address for search results
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
      
      return json({ businesses: enhancedBusinesses });
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
        
        // Transform the employees data to include contact name
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
        
        // Return enhanced business with related data
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
    
    return json({ businesses: enhancedBusinesses });
  } catch (err) {
    console.error('Error fetching businesses:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch businesses');
  }
};

// POST /api/businesses - Create a new business
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Get the business data from the request body
    const requestData = await request.json();
    console.log('API received request data:', JSON.stringify(requestData, null, 2));
    
    const { workspaceId, business, phoneNumbers, addresses, socialMedia, employees, tags } = requestData;
    
    console.log('API destructured data:', {
      workspaceId,
      business,
      phoneNumbersCount: phoneNumbers?.length,
      addressesCount: addresses?.length,
      socialMediaCount: socialMedia?.length,
      employeesCount: employees?.length,
      tagsCount: tags?.length
    });
    
    if (!business || !business.businessName) {
      throw error(400, 'Business name is required');
    }
    
    // Verify workspace access
    await verifyWorkspaceAccess(locals.user, workspaceId);
    
    // Create the business
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        businessName: business.businessName,
        status: business.status || 'active',
        workspaceId: workspaceId
      })
      .returning();
    
    if (!newBusiness) {
      throw error(500, 'Failed to create business');
    }
    
    // Create phone numbers if provided
    if (phoneNumbers && phoneNumbers.length > 0) {
      // Validate phoneNumbers to avoid undefined errors
      const validPhones = phoneNumbers.filter(phone => phone && phone.phoneNumber);
      if (validPhones.length > 0) {
        await db.insert(businessPhoneNumbers).values(
          validPhones.map((phone) => ({
            businessId: newBusiness.id,
            phoneNumber: phone.phoneNumber,
            status: phone.status || 'active'
          }))
        );
      } else {
        console.log('No valid phone numbers to insert');
      }
    }
    
    // Process addresses if provided
    if (addresses && addresses.length > 0) {
      // Process each address individually to handle zipCode creation
      for (const address of addresses) {
        // Validate address properties to avoid undefined errors
        if (!address || !address.streetAddress) {
          console.error('Invalid address data:', address);
          continue; // Skip this address
        }
        
        let zipCodeId = address.zipCodeId;

        // If zipCodeId is not provided but zipCode is, find or create the zipCode
        if (!zipCodeId && address.zipCode) {
          // Try to find existing zipCode
          const existingZipCode = await db
            .select()
            .from(zipCodes)
            .where(eq(zipCodes.name, address.zipCode.trim()))
            .limit(1);

          if (existingZipCode && existingZipCode.length > 0) {
            // Use existing zipCode
            zipCodeId = existingZipCode[0].id;
          } else {
            // Create new zipCode
            const [newZipCode] = await db
              .insert(zipCodes)
              .values({
                name: address.zipCode.trim(),
                stateId: address.stateId || null,
              })
              .returning();

            if (newZipCode) {
              zipCodeId = newZipCode.id;
            }
          }
        }

        // Create the address with the zipCodeId
        await db.insert(businessAddresses).values({
          businessId: newBusiness.id,
          streetAddress: address.streetAddress,
          secondaryStreetAddress: address.secondaryStreetAddress || null,
          city: address.city,
          stateId: address.stateId,
          zipCodeId: zipCodeId,
          status: address.status || 'active'
        });
      }
    }
    
    // Create social media accounts if provided
    if (socialMedia && socialMedia.length > 0) {
      // Validate social media entries
      const validSocial = socialMedia.filter(account => account && account.socialMediaAccount && account.serviceType);
      
      if (validSocial.length > 0) {
        await db.insert(businessSocialMediaAccounts).values(
          validSocial.map((account) => ({
            businessId: newBusiness.id,
            serviceType: account.serviceType,
            socialMediaAccount: account.socialMediaAccount,
            status: account.status || 'active'
          }))
        );
      } else {
        console.log('No valid social media accounts to insert');
      }
    }
    
    // Create employee relationships if provided
    if (employees && employees.length > 0) {
      // Validate employees to avoid undefined errors
      const validEmployees = employees.filter(employee => employee && employee.contactId);
      
      if (validEmployees.length > 0) {
        await db.insert(businessEmployees).values(
          validEmployees.map((employee) => ({
            businessId: newBusiness.id,
            contactId: employee.contactId,
            status: employee.status || 'active'
          }))
        );
      } else {
        console.log('No valid employees to insert');
      }
    }
    
    // Create tags if provided
    if (tags && tags.length > 0) {
      await db.insert(businessTags).values(
        tags.map((tag) => ({
          businessId: newBusiness.id,
          tag: tag
        }))
      );
    }
    
    // Fetch the complete business with all related data
    const phonesList = await db
      .select()
      .from(businessPhoneNumbers)
      .where(eq(businessPhoneNumbers.businessId, newBusiness.id));
    
    const addressesList = await db
      .select()
      .from(businessAddresses)
      .where(eq(businessAddresses.businessId, newBusiness.id));
    
    const socialMediaList = await db
      .select()
      .from(businessSocialMediaAccounts)
      .where(eq(businessSocialMediaAccounts.businessId, newBusiness.id));
    
    // Get employees with contact details
    const employeesList = await db
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
      .where(eq(businessEmployees.businessId, newBusiness.id));
    
    // Transform the employees data to include contact name
    const employeesWithContactNames = employeesList.map(employee => ({
      id: employee.id,
      businessId: employee.businessId,
      contactId: employee.contactId,
      status: employee.status,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      contactName: employee.contactFirstName && employee.contactLastName ? 
        `${employee.contactFirstName} ${employee.contactLastName}` : 'Unknown Contact'
    }));
    
    const tagsList = await db
      .select()
      .from(businessTags)
      .where(eq(businessTags.businessId, newBusiness.id));
    
    // Return the created business with all related data
    return json({
      business: {
        ...newBusiness,
        phoneNumbers: phonesList || [],
        addresses: addressesList || [],
        socialMediaAccounts: socialMediaList || [],
        employees: employeesWithContactNames || [],
        tags: tagsList || [],
      }
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating business:', err);
    
    // Log more detailed error information
    if (err instanceof Error) {
      console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, `Failed to create business: ${err.message || 'Unknown error'}`);
  }
};
