import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contacts, userWorkspaces, contactEmails, contactPhoneNumbers, contactAddresses, contactSocialMediaAccounts, contactTags, zipCodes } from '$lib/db/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { verifyResourceAccess } from '$lib/utils/auth';



// GET /api/contacts/[id] - Get a specific contact by ID
export const GET: RequestHandler = async ({ params, locals }) => {
  const contactId = params.id;
  console.log('API: GET contact request for ID:', contactId);
  
  try {
    // Check workspace access and get contact
    const { resource: contact } = await verifyResourceAccess(locals.user, contactId, contacts);
    
    // Get emails
    const emails = await db
      .select()
      .from(contactEmails)
      .where(eq(contactEmails.contactId, contactId));
    console.log(`API: Found ${emails.length} emails for contact:`, emails);
    
    // Get phone numbers
    const phoneNumbers = await db
      .select()
      .from(contactPhoneNumbers)
      .where(eq(contactPhoneNumbers.contactId, contactId));
    console.log(`API: Found ${phoneNumbers.length} phone numbers for contact:`, phoneNumbers);
    
    // Get addresses
    const addressesQuery = await db
      .select({
        address: contactAddresses,
        zipCode: zipCodes
      })
      .from(contactAddresses)
      .leftJoin(zipCodes, eq(contactAddresses.zipCodeId, zipCodes.id))
      .where(eq(contactAddresses.contactId, contactId));
    
    // Process addresses to include zipCode data
    const addresses = addressesQuery.map(item => ({
      ...item.address,
      zipCodeName: item.zipCode?.name || null,
    }));
    
    console.log(`API: Found ${addresses.length} addresses for contact:`, addresses);
    
    // Get social media accounts
    const socialMedia = await db
      .select()
      .from(contactSocialMediaAccounts)
      .where(eq(contactSocialMediaAccounts.contactId, contactId));
    console.log(`API: Found ${socialMedia.length} social media accounts for contact:`, socialMedia);
    
    // Get tags
    const tags = await db
      .select()
      .from(contactTags)
      .where(
        and(
          eq(contactTags.contactId, contactId),
          eq(contactTags.workspaceId, contact.workspaceId)
        )
      );
    
    
    // Build the response object
    const responseData = {
      contact: {
        ...contact,
        emails: emails || [],
        phoneNumbers: phoneNumbers || [],
        addresses: addresses || [],
        socialMediaAccounts: socialMedia || [],
        tags: tags || [],
      }
    };
    
    console.log('API: Contact response built with the following structure:', {
      hasEmails: (emails || []).length > 0,
      hasPhoneNumbers: (phoneNumbers || []).length > 0,
      hasAddresses: (addresses || []).length > 0,
      hasSocialMedia: (socialMedia || []).length > 0,
      hasTags: (tags || []).length > 0,
      // Show first few characters of each array for debugging
      emailsPreview: JSON.stringify(emails || []).substring(0, 100),
      phoneNumbersPreview: JSON.stringify(phoneNumbers || []).substring(0, 100),
      addressesPreview: JSON.stringify(addresses || []).substring(0, 100),
      socialMediaPreview: JSON.stringify(socialMedia || []).substring(0, 100)
    });
    
    return json(responseData);
  } catch (err) {
    console.error('Error fetching contact:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch contact');
  }
};

// PUT /api/contacts/[id] - Update a contact
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const contactId = params.id;
  
  try {
    // Check workspace access
    const { resource: contact } = await verifyResourceAccess(locals.user, contactId, contacts);
    
    // Get the updated contact data
    const requestData = await request.json();
    const { contactData, emails, phoneNumbers, addresses, socialMedia, tags } = requestData;
    
    // Update the contact
    if (contactData) {
      try {
        // Print out values for debugging
        console.log('Contact basic info update values:', {
          firstName: contactData.firstName || contact.firstName,
          lastName: contactData.lastName || contact.lastName,
          middleName: contactData.middleName,
          genderId: contactData.genderId || null, // Handle potentially empty UUID
          raceId: contactData.raceId || null, // Handle potentially empty UUID
          updatedById: locals.user.id || null // Handle potentially empty UUID
        });
        
        await db
          .update(contacts)
          .set({
            firstName: contactData.firstName || contact.firstName,
            lastName: contactData.lastName || contact.lastName,
            middleName: contactData.middleName || null,
            genderId: contactData.genderId || null, // Handle potentially empty UUID
            raceId: contactData.raceId || null, // Handle potentially empty UUID
            pronouns: contactData.pronouns || null,
            vanid: contactData.vanid || null,
            status: contactData.status || contact.status,
            updatedById: locals.user.id || null, // Handle potentially empty UUID
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, contactId));
      } catch (updateErr) {
        console.error('Error updating contact basic info:', updateErr);
        throw new Error(`Failed to update contact basic info: ${updateErr.message}`);
      }
    }
    
    // Handle emails: keep existing ones and add/update/delete as needed
    if (emails) {
      try {
        console.log('Processing email updates, raw data:', JSON.stringify(emails));
        
        // Check if emails is array and not null/undefined
        if (!Array.isArray(emails)) {
          console.error('Emails is not an array:', emails);
          throw new Error('Invalid emails data: not an array');
        }
        
        // Process all emails - include deleted ones but filter valid values
        for (const email of emails) {
          // Debug flags for each email
          console.log('Processing email:', {
            id: email.id,
            email: email.email,
            isNew: !!email.isNew,
            isModified: !!email.isModified,
            isDeleted: !!email.isDeleted
          });
          
          if (email.isDeleted && email.id) {
            // Delete email first (handle in separate condition)
            console.log('Deleting email with ID:', email.id);
            try {
              await db
                .delete(contactEmails)
                .where(eq(contactEmails.id, email.id));
            } catch (deleteErr) {
              console.error('Error deleting email:', deleteErr);
              throw new Error(`Failed to delete email: ${deleteErr.message}`);
            }
          } else if (email.isNew && email.email && email.email.trim() !== '') {
            // Add new email if it has valid content
            console.log('Adding new email:', email.email);
            try {
              await db.insert(contactEmails).values({
                contactId: contactId,
                email: email.email.trim(),
                status: email.status || 'active',
                createdById: locals.user.id || null, // Handle potential null UUID
                updatedById: locals.user.id || null, // Handle potential null UUID
              });
            } catch (insertErr) {
              console.error('Error inserting email - full details:', {
                error: insertErr,
                email,
                contactId,
                userId: locals.user.id,
              });
              throw new Error(`Failed to insert email: ${insertErr.message}`);
            }
          } else if (email.isModified && email.id && email.email && email.email.trim() !== '') {
            // Update existing email if it has valid content and ID
            console.log('Updating email with ID:', email.id);
            try {
            await db
            .update(contactEmails)
            .set({
            email: email.email.trim(),
            status: email.status || 'active',
            updatedById: locals.user.id || null, // Handle potential null UUID
            updatedAt: new Date(),
            })
            .where(eq(contactEmails.id, email.id));
            } catch (updateErr) {
            console.error('Error updating email - full details:', {
              error: updateErr,
                email,
                  contactId,
                  userId: locals.user.id,
                });
                throw new Error(`Failed to update email: ${updateErr.message}`);
              }
          }
        }
      } catch (err) {
        console.error('Error processing emails:', err);
        throw new Error(`Failed to process emails: ${err.message}`);
      }
    }
    
    // Handle phone numbers: keep existing ones and add/update/delete as needed
    if (phoneNumbers) {
      try {
        console.log('Processing phone numbers update, raw data:', JSON.stringify(phoneNumbers));
        
        // Check if phoneNumbers is array and not null/undefined
        if (!Array.isArray(phoneNumbers)) {
          console.error('PhoneNumbers is not an array:', phoneNumbers);
          throw new Error('Invalid phoneNumbers data: not an array');
        }
        
        // Process all phone numbers - include deleted ones but filter valid values
        for (const phone of phoneNumbers) {
          // Debug flags for each phone number
          console.log('Processing phone number:', {
            id: phone.id,
            phoneNumber: phone.phoneNumber,
            isNew: !!phone.isNew,
            isModified: !!phone.isModified,
            isDeleted: !!phone.isDeleted
          });
          
          if (phone.isDeleted && phone.id) {
            // Delete phone number first (handle in separate condition)
            console.log('Deleting phone number with ID:', phone.id);
            try {
              await db
                .delete(contactPhoneNumbers)
                .where(eq(contactPhoneNumbers.id, phone.id));
            } catch (deleteErr) {
              console.error('Error deleting phone number:', deleteErr);
              throw new Error(`Failed to delete phone number: ${deleteErr.message}`);
            }
          } else if (phone.isNew && phone.phoneNumber && phone.phoneNumber.trim() !== '') {
            // Add new phone number if it has valid content
            console.log('Adding new phone number:', phone.phoneNumber);
            try {
            await db.insert(contactPhoneNumbers).values({
            contactId: contactId,
            phoneNumber: phone.phoneNumber.trim(),
            status: phone.status || 'active',
            createdById: locals.user.id || null, // Handle potential null UUID
            updatedById: locals.user.id || null, // Handle potential null UUID
            });
            } catch (insertErr) {
            console.error('Error inserting phone number - full details:', {
              error: insertErr,
                phone,
                  contactId,
                  userId: locals.user.id,
                });
                throw new Error(`Failed to insert phone number: ${insertErr.message}`);
              }
          } else if (phone.isModified && phone.id && phone.phoneNumber && phone.phoneNumber.trim() !== '') {
            // Update existing phone number if it has valid content and ID
            console.log('Updating phone number with ID:', phone.id);
            try {
            await db
            .update(contactPhoneNumbers)
            .set({
            phoneNumber: phone.phoneNumber.trim(),
            status: phone.status || 'active',
            updatedById: locals.user.id || null, // Handle potential null UUID
            updatedAt: new Date(),
            })
            .where(eq(contactPhoneNumbers.id, phone.id));
            } catch (updateErr) {
            console.error('Error updating phone number - full details:', {
              error: updateErr,
                phone,
                  contactId,
                  userId: locals.user.id,
                });
                throw new Error(`Failed to update phone number: ${updateErr.message}`);
              }
          }
        }
      } catch (err) {
        console.error('Error processing phone numbers:', err);
        throw new Error(`Failed to process phone numbers: ${err.message}`);
      }
    }
    
    // Handle addresses: keep existing ones and add/update/delete as needed
    if (addresses) {
      try {
        console.log('Processing address updates, raw data:', JSON.stringify(addresses));
        
        // Check if addresses is array and not null/undefined
        if (!Array.isArray(addresses)) {
          console.error('Addresses is not an array:', addresses);
          throw new Error('Invalid addresses data: not an array');
        }
        
        // Process all addresses
        for (const address of addresses) {
          // Debug flags for each address
          console.log('Processing address:', {
            id: address.id,
            streetAddress: address.streetAddress,
            zipCode: address.zipCode,
            isNew: !!address.isNew,
            isModified: !!address.isModified,
            isDeleted: !!address.isDeleted
          });
          
          if (address.isDeleted && address.id) {
            // Delete address first (handle in separate condition)
            console.log('Deleting address with ID:', address.id);
            try {
              await db
                .delete(contactAddresses)
                .where(eq(contactAddresses.id, address.id));
            } catch (deleteErr) {
              console.error('Error deleting address:', deleteErr);
              throw new Error(`Failed to delete address: ${deleteErr.message}`);
            }
          } else if ((address.isNew || address.isModified) && 
                     address.streetAddress && address.streetAddress.trim() !== '' &&
                     address.city && address.city.trim() !== '') {
            
            // Handle zip code retrieval or creation
            let zipCodeId = address.zipCodeId || null;
            
            // If zipCode is provided but zipCodeId is null/empty, find or create the zipCode
            if (!zipCodeId && address.zipCode && address.zipCode.trim() !== '') {
              try {
                console.log(`Looking up or creating zip code: ${address.zipCode}`);
                // Try to find existing zipCode
                const existingZipCode = await db
                  .select()
                  .from(zipCodes)
                  .where(eq(zipCodes.name, address.zipCode.trim()))
                  .limit(1);
                
                console.log('Zip code lookup result:', existingZipCode);
                
                if (existingZipCode && existingZipCode.length > 0) {
                  // Use existing zipCode
                  zipCodeId = existingZipCode[0].id;
                  console.log(`Found existing zip code with ID: ${zipCodeId}`);
                } else {
                  // Create new zipCode
                  console.log(`Creating new zip code: ${address.zipCode} with stateId: ${address.stateId || null}`);
                  const [newZipCode] = await db
                    .insert(zipCodes)
                    .values({
                      name: address.zipCode.trim(),
                      stateId: address.stateId || null,
                    })
                    .returning();
                  
                  if (newZipCode) {
                    zipCodeId = newZipCode.id;
                    console.log(`Created new zip code with ID: ${zipCodeId}`);
                  } else {
                    console.error('Failed to create new zip code');
                  }
                }
              } catch (zipError) {
                console.error('Error handling zip code:', zipError);
                throw new Error(`Failed to process zip code: ${zipError.message}`);
              }
            }
            
            if (address.isNew) {
              // Add new address
              console.log('Adding new address:', {
                streetAddress: address.streetAddress,
                city: address.city,
                zipCodeId
              });
              
              try {
                await db.insert(contactAddresses).values({
                  contactId: contactId,
                  streetAddress: address.streetAddress.trim(),
                  secondaryStreetAddress: address.secondaryStreetAddress || null,
                  city: address.city.trim(),
                  stateId: address.stateId || null,
                  zipCodeId: zipCodeId, // Use the found or created zipCodeId
                  status: address.status || 'active',
                  createdById: locals.user.id || null,
                  updatedById: locals.user.id || null,
                });
              } catch (insertErr) {
                console.error('Error inserting address:', insertErr);
                throw new Error(`Failed to insert address: ${insertErr.message}`);
              }
            } else if (address.isModified && address.id) {
              // Update existing address
              console.log('Updating address with ID:', address.id, {
                streetAddress: address.streetAddress,
                city: address.city,
                zipCodeId
              });
              
              try {
                await db
                  .update(contactAddresses)
                  .set({
                    streetAddress: address.streetAddress.trim(),
                    secondaryStreetAddress: address.secondaryStreetAddress || null,
                    city: address.city.trim(),
                    stateId: address.stateId || null,
                    zipCodeId: zipCodeId, // Use the found or created zipCodeId
                    status: address.status || 'active',
                    updatedById: locals.user.id || null,
                    updatedAt: new Date(),
                  })
                  .where(eq(contactAddresses.id, address.id));
              } catch (updateErr) {
                console.error('Error updating address:', updateErr);
                throw new Error(`Failed to update address: ${updateErr.message}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error processing addresses:', err);
        throw new Error(`Failed to process addresses: ${err.message}`);
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
            await db.insert(contactSocialMediaAccounts).values({
              contactId: contactId,
              serviceType: account.serviceType,
              socialMediaAccount: account.socialMediaAccount,
              status: account.status || 'active',
              createdById: locals.user.id,
              updatedById: locals.user.id,
            });
          } else if (account.isModified && account.id) {
            // Update existing social media account
            console.log('Updating social media account with ID:', account.id);
            await db
              .update(contactSocialMediaAccounts)
              .set({
                serviceType: account.serviceType,
                socialMediaAccount: account.socialMediaAccount,
                status: account.status || 'active',
                updatedById: locals.user.id,
                updatedAt: new Date(),
              })
              .where(eq(contactSocialMediaAccounts.id, account.id));
          } else if (account.isDeleted && account.id) {
            // Delete social media account
            console.log('Deleting social media account with ID:', account.id);
            await db
              .delete(contactSocialMediaAccounts)
              .where(eq(contactSocialMediaAccounts.id, account.id));
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
        .from(contactTags)
        .where(
          and(
            eq(contactTags.contactId, contactId),
            eq(contactTags.workspaceId, contact.workspaceId)
          )
        );
      
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
        await db.insert(contactTags).values(
          tagsToAdd.map(tag => ({
            contactId: contactId,
            workspaceId: contact.workspaceId,
            tag: tag,
          }))
        );
      }
      
      // Remove tags that are no longer needed
      if (tagsToRemove.length > 0) {
        console.log('Removing tags:', tagsToRemove.map(t => t.tag));
        for (const tagToRemove of tagsToRemove) {
          await db
            .delete(contactTags)
            .where(eq(contactTags.id, tagToRemove.id));
        }
      }
    }
    
    // Fetch the updated contact with all related data
    const updatedContact = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);
    
    const updatedEmails = await db
      .select()
      .from(contactEmails)
      .where(eq(contactEmails.contactId, contactId));
    
    const updatedPhoneNumbers = await db
      .select()
      .from(contactPhoneNumbers)
      .where(eq(contactPhoneNumbers.contactId, contactId));
    
    // Get addresses with zipCode information
    const updatedAddressesQuery = await db
      .select({
        address: contactAddresses,
        zipCode: zipCodes
      })
      .from(contactAddresses)
      .leftJoin(zipCodes, eq(contactAddresses.zipCodeId, zipCodes.id))
      .where(eq(contactAddresses.contactId, contactId));
    
    // Process addresses to include zipCode data
    const updatedAddresses = updatedAddressesQuery.map(item => ({
      ...item.address,
      zipCodeName: item.zipCode?.name || null,
    }));
    
    const updatedSocialMedia = await db
      .select()
      .from(contactSocialMediaAccounts)
      .where(eq(contactSocialMediaAccounts.contactId, contactId));
    
    const updatedTags = await db
      .select()
      .from(contactTags)
      .where(
        and(
          eq(contactTags.contactId, contactId),
          eq(contactTags.workspaceId, contact.workspaceId)
        )
      );
    
    // Return the updated contact with all related data
    return json({
      contact: {
        ...updatedContact[0],
        emails: updatedEmails || [],
        phoneNumbers: updatedPhoneNumbers || [],
        addresses: updatedAddresses || [],
        socialMediaAccounts: updatedSocialMedia || [],
        tags: updatedTags || [],
      }
    });
  } catch (err) {
    console.error('Error updating contact:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    // Return a more detailed error message
    let errorMessage = 'Failed to update contact';
    if (err instanceof Error) {
      errorMessage = `${errorMessage}: ${err.message}`;
      console.error('Detailed error:', err.stack);
    }
    
    throw error(500, errorMessage);
  }
};

// DELETE /api/contacts/[id] - Delete a contact
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const contactId = params.id;
  
  try {
    // Check workspace access
    await verifyResourceAccess(locals.user, contactId, contacts);
    
    // Delete all related data first (automatically handled by cascade in most cases,
    // but we'll explicitly delete them for clarity and to avoid potential issues)
    
    // Delete emails
    await db
      .delete(contactEmails)
      .where(eq(contactEmails.contactId, contactId));
    
    // Delete phone numbers
    await db
      .delete(contactPhoneNumbers)
      .where(eq(contactPhoneNumbers.contactId, contactId));
    
    // Delete addresses
    await db
      .delete(contactAddresses)
      .where(eq(contactAddresses.contactId, contactId));
    
    // Delete social media accounts
    await db
      .delete(contactSocialMediaAccounts)
      .where(eq(contactSocialMediaAccounts.contactId, contactId));
    
    // Delete tags
    await db
      .delete(contactTags)
      .where(eq(contactTags.contactId, contactId));
    
    // Finally, delete the contact
    await db
      .delete(contacts)
      .where(eq(contacts.id, contactId));
    
    return json({ success: true });
  } catch (err) {
    console.error('Error deleting contact:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to delete contact');
  }
};
