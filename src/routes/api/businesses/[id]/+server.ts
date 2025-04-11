import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { businesses, userWorkspaces, businessPhoneNumbers, businessAddresses, businessSocialMediaAccounts, businessEmployees, businessTags, zipCodes, contacts } from '$lib/db/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyResourceAccess } from '$lib/utils/auth';



// GET /api/businesses/[id] - Get a specific business by ID
export const GET: RequestHandler = async ({ params, locals }) => {
  const businessId = params.id;
  console.log('API: GET business request for ID:', businessId);
  
  try {
    // Check workspace access and get business
    const { resource: business } = await verifyResourceAccess(locals.user, businessId, businesses);
    
    // Get phone numbers
    const phoneNumbers = await db
      .select()
      .from(businessPhoneNumbers)
      .where(eq(businessPhoneNumbers.businessId, businessId));
    console.log(`API: Found ${phoneNumbers.length} phone numbers for business:`, phoneNumbers);
    
    // Get addresses
    const addresses = await db
      .select()
      .from(businessAddresses)
      .where(eq(businessAddresses.businessId, businessId));
    console.log(`API: Found ${addresses.length} addresses for business:`, addresses);
    
    // Get social media accounts
    const socialMedia = await db
      .select()
      .from(businessSocialMediaAccounts)
      .where(eq(businessSocialMediaAccounts.businessId, businessId));
    console.log(`API: Found ${socialMedia.length} social media accounts for business:`, socialMedia);
    
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
      .where(eq(businessEmployees.businessId, businessId));
    
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
    
    console.log(`API: Found ${employeesWithContactNames.length} employees for business:`, employeesWithContactNames);
    
    // Get tags
    const tags = await db
      .select()
      .from(businessTags)
      .where(eq(businessTags.businessId, businessId));
    
    // Build the response object
    const responseData = {
      business: {
        ...business,
        phoneNumbers: phoneNumbers || [],
        addresses: addresses || [],
        socialMediaAccounts: socialMedia || [],
        employees: employeesWithContactNames || [],
        tags: tags || [],
      }
    };
    
    console.log('API: Business response built with the following structure:', {
      hasPhoneNumbers: (phoneNumbers || []).length > 0,
      hasAddresses: (addresses || []).length > 0,
      hasSocialMedia: (socialMedia || []).length > 0,
      hasEmployees: (employees || []).length > 0,
      hasTags: (tags || []).length > 0,
      // Show first few characters of each array for debugging
      phoneNumbersPreview: JSON.stringify(phoneNumbers || []).substring(0, 100),
      addressesPreview: JSON.stringify(addresses || []).substring(0, 100),
      socialMediaPreview: JSON.stringify(socialMedia || []).substring(0, 100),
      employeesPreview: JSON.stringify(employees || []).substring(0, 100)
    });
    
    return json(responseData);
  } catch (err) {
    console.error('Error fetching business:', err);
    
    // More detailed error logging
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
    
    throw error(500, 'Failed to fetch business');
  }
};

// PUT /api/businesses/[id] - Update a business
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const businessId = params.id;
  
  try {
    // Check workspace access
    const { resource: business } = await verifyResourceAccess(locals.user, businessId, businesses);
    
    // Get the updated business data
    const requestData = await request.json();
    const { businessData, phoneNumbers, addresses, socialMedia, employees, tags } = requestData;
    
    // Update the business
    if (businessData) {
      await db
        .update(businesses)
        .set({
          businessName: businessData.businessName || business.businessName,
          status: businessData.status || business.status,
          updatedAt: new Date()
        })
        .where(eq(businesses.id, businessId));
    }
    
    // Handle phone numbers: keep existing ones and add/update/delete as needed
    if (phoneNumbers) {
      console.log('Processing phone numbers update:', phoneNumbers);
      
      // Filter out valid phone numbers
      const validPhoneNumbers = phoneNumbers.filter(phone => phone.phoneNumber && phone.phoneNumber.trim() !== '');
      
      if (validPhoneNumbers.length > 0) {
        // For each phone number, check if it's new, modified or deleted
        for (const phone of validPhoneNumbers) {
          if (phone.isNew) {
            // Add new phone number
            console.log('Adding new phone number:', phone.phoneNumber);
            await db.insert(businessPhoneNumbers).values({
              businessId: businessId,
              phoneNumber: phone.phoneNumber,
              status: phone.status || 'active'
            });
          } else if (phone.isModified && phone.id) {
            // Update existing phone number
            console.log('Updating phone number with ID:', phone.id);
            await db
              .update(businessPhoneNumbers)
              .set({
                phoneNumber: phone.phoneNumber,
                status: phone.status || 'active',
                updatedAt: new Date()
              })
              .where(eq(businessPhoneNumbers.id, phone.id));
          } else if (phone.isDeleted && phone.id) {
            // Delete phone number
            console.log('Deleting phone number with ID:', phone.id);
            await db
              .delete(businessPhoneNumbers)
              .where(eq(businessPhoneNumbers.id, phone.id));
          }
        }
      }
    }
    
    // Handle addresses: keep existing ones and add/update/delete as needed
    if (addresses) {
      console.log('Processing address updates:', addresses);
      
      // Filter out valid addresses
      const validAddresses = addresses.filter(address => 
        address.streetAddress && address.streetAddress.trim() !== '' &&
        address.city && address.city.trim() !== '');
      
      if (validAddresses.length > 0) {
        // For each address, check if it's new, modified or deleted
        for (const address of validAddresses) {
          if (address.isDeleted && address.id) {
            // Delete address
            console.log('Deleting address with ID:', address.id);
            await db
              .delete(businessAddresses)
              .where(eq(businessAddresses.id, address.id));
          } else if (address.isNew || (address.isModified && address.id)) {
            // Handle zip code retrieval or creation
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

            if (address.isNew) {
              // Add new address
              console.log('Adding new address:', address.streetAddress);
              await db.insert(businessAddresses).values({
                businessId: businessId,
                streetAddress: address.streetAddress,
                secondaryStreetAddress: address.secondaryStreetAddress || null,
                city: address.city,
                stateId: address.stateId,
                zipCodeId: zipCodeId,
                status: address.status || 'active'
              });
            } else if (address.isModified && address.id) {
              // Update existing address
              console.log('Updating address with ID:', address.id);
              await db
                .update(businessAddresses)
                .set({
                  streetAddress: address.streetAddress,
                  secondaryStreetAddress: address.secondaryStreetAddress || null,
                  city: address.city,
                  stateId: address.stateId,
                  zipCodeId: zipCodeId,
                  status: address.status || 'active',
                  updatedAt: new Date()
                })
                .where(eq(businessAddresses.id, address.id));
            }
          }
        }
      }
    }
    
    // Handle social media accounts: keep existing ones and add/update/delete as needed
    if (socialMedia) {
      console.log('Processing social media updates:', socialMedia);
      
      // Filter out valid social media accounts
      const validSocialMedia = socialMedia.filter(account => 
        account.socialMediaAccount && account.socialMediaAccount.trim() !== '' &&
        account.serviceType);
      
      if (validSocialMedia.length > 0) {
        // For each social media account, check if it's new, modified or deleted
        for (const account of validSocialMedia) {
          if (account.isNew) {
            // Add new social media account
            console.log('Adding new social media account:', account.socialMediaAccount);
            await db.insert(businessSocialMediaAccounts).values({
              businessId: businessId,
              serviceType: account.serviceType,
              socialMediaAccount: account.socialMediaAccount,
              status: account.status || 'active'
            });
          } else if (account.isModified && account.id) {
            // Update existing social media account
            console.log('Updating social media account with ID:', account.id);
            await db
              .update(businessSocialMediaAccounts)
              .set({
                serviceType: account.serviceType,
                socialMediaAccount: account.socialMediaAccount,
                status: account.status || 'active',
                updatedAt: new Date()
              })
              .where(eq(businessSocialMediaAccounts.id, account.id));
          } else if (account.isDeleted && account.id) {
            // Delete social media account
            console.log('Deleting social media account with ID:', account.id);
            await db
              .delete(businessSocialMediaAccounts)
              .where(eq(businessSocialMediaAccounts.id, account.id));
          }
        }
      }
    }
    
    // Handle employees: keep existing ones and add/update/delete as needed
    if (employees) {
      console.log('Processing employee updates:', employees);
      
      // Filter out valid employees
      const validEmployees = employees.filter(employee => employee.contactId);
      
      if (validEmployees.length > 0) {
        // For each employee, check if it's new, modified or deleted
        for (const employee of validEmployees) {
          // Store employee role information outside of the database 
          // since it doesn't have a column for it yet
          const employeeRole = employee.role || '';  // Capture the role
          
          if (employee.isNew) {
            // Add new employee
            console.log('Adding new employee with contact ID:', employee.contactId);
            await db.insert(businessEmployees).values({
              businessId: businessId,
              contactId: employee.contactId,
              status: employee.status || 'active'
            });
          } else if (employee.isModified && employee.id) {
            // Update existing employee
            console.log('Updating employee with ID:', employee.id);
            await db
              .update(businessEmployees)
              .set({
                contactId: employee.contactId,
                status: employee.status || 'active',
                updatedAt: new Date()
              })
              .where(eq(businessEmployees.id, employee.id));
          } else if (employee.isDeleted && employee.id) {
            // Delete employee
            console.log('Deleting employee with ID:', employee.id);
            await db
              .delete(businessEmployees)
              .where(eq(businessEmployees.id, employee.id));
          }
        }
      }
    }
    
    // Handle tags specially: compare existing vs new tags and make minimal changes
    if (tags) {
      console.log('Processing tag updates:', tags);
      
      // Get existing tags
      const existingTags = await db
        .select()
        .from(businessTags)
        .where(eq(businessTags.businessId, businessId));
      
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
        await db.insert(businessTags).values(
          tagsToAdd.map(tag => ({
            businessId: businessId,
            tag: tag
          }))
        );
      }
      
      // Remove tags that are no longer needed
      if (tagsToRemove.length > 0) {
        console.log('Removing tags:', tagsToRemove.map(t => t.tag));
        for (const tagToRemove of tagsToRemove) {
          await db
            .delete(businessTags)
            .where(eq(businessTags.id, tagToRemove.id));
        }
      }
    }
    
    // Fetch the updated business with all related data
    const updatedBusiness = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);
    
    const updatedPhoneNumbers = await db
      .select()
      .from(businessPhoneNumbers)
      .where(eq(businessPhoneNumbers.businessId, businessId));
    
    const updatedAddresses = await db
      .select()
      .from(businessAddresses)
      .where(eq(businessAddresses.businessId, businessId));
    
    const updatedSocialMedia = await db
      .select()
      .from(businessSocialMediaAccounts)
      .where(eq(businessSocialMediaAccounts.businessId, businessId));
    
    // Get updated employees with contact details
    const updatedEmployees = await db
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
      .where(eq(businessEmployees.businessId, businessId));
      
    // Transform the employees data to include contact name
    const updatedEmployeesWithContactNames = updatedEmployees.map(employee => ({
      id: employee.id,
      businessId: employee.businessId,
      contactId: employee.contactId,
      status: employee.status,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      contactName: employee.contactFirstName && employee.contactLastName ? 
        `${employee.contactFirstName} ${employee.contactLastName}` : 'Unknown Contact'
    }));
    
    const updatedTags = await db
      .select()
      .from(businessTags)
      .where(eq(businessTags.businessId, businessId));
    
    // Return the updated business with all related data
    return json({
      business: {
        ...updatedBusiness[0],
        phoneNumbers: updatedPhoneNumbers || [],
        addresses: updatedAddresses || [],
        socialMediaAccounts: updatedSocialMedia || [],
        employees: updatedEmployeesWithContactNames || [],
        tags: updatedTags || [],
      }
    });
  } catch (err) {
    console.error('Error updating business:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to update business');
  }
};

// DELETE /api/businesses/[id] - Delete a business
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const businessId = params.id;
  
  try {
    // Check workspace access
    await verifyResourceAccess(locals.user, businessId, businesses);
    
    // Delete all related data first (automatically handled by cascade in most cases,
    // but we'll explicitly delete them for clarity and to avoid potential issues)
    
    // Delete phone numbers
    await db
      .delete(businessPhoneNumbers)
      .where(eq(businessPhoneNumbers.businessId, businessId));
    
    // Delete addresses
    await db
      .delete(businessAddresses)
      .where(eq(businessAddresses.businessId, businessId));
    
    // Delete social media accounts
    await db
      .delete(businessSocialMediaAccounts)
      .where(eq(businessSocialMediaAccounts.businessId, businessId));
    
    // Delete employees
    await db
      .delete(businessEmployees)
      .where(eq(businessEmployees.businessId, businessId));
    
    // Delete tags
    await db
      .delete(businessTags)
      .where(eq(businessTags.businessId, businessId));
    
    // Finally, delete the business
    await db
      .delete(businesses)
      .where(eq(businesses.id, businessId));
    
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting business:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to delete business');
  }
};
