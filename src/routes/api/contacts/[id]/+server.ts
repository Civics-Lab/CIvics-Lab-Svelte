import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { contacts, userWorkspaces, contactEmails, contactPhoneNumbers, contactAddresses, contactSocialMediaAccounts, contactTags, zipCodes } from '$lib/db/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Utility function to check workspace access
async function checkWorkspaceAccess(userId: string, contactId: string) {
  // First, get the contact to determine its workspace
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);
  
  if (!contact) {
    throw error(404, 'Contact not found');
  }
  
  // Then check if the user has access to this workspace
  const [userWorkspace] = await db
    .select()
    .from(userWorkspaces)
    .where(
      and(
        eq(userWorkspaces.userId, userId),
        eq(userWorkspaces.workspaceId, contact.workspaceId)
      )
    )
    .limit(1);
  
  if (!userWorkspace) {
    throw error(403, 'You do not have access to this contact');
  }
  
  return { contact, userWorkspace };
}

// GET /api/contacts/[id] - Get a specific contact by ID
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const contactId = params.id;
  console.log('API: GET contact request for ID:', contactId);
  
  try {
    // Check workspace access and get contact
    const { contact } = await checkWorkspaceAccess(user.id, contactId);
    
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
    const addresses = await db
      .select()
      .from(contactAddresses)
      .where(eq(contactAddresses.contactId, contactId));
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
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const contactId = params.id;
  
  try {
    // Check workspace access
    const { contact, userWorkspace } = await checkWorkspaceAccess(user.id, contactId);
    
    // Get the updated contact data
    const requestData = await request.json();
    const { contactData, emails, phoneNumbers, addresses, socialMedia, tags } = requestData;
    
    // Update the contact
    if (contactData) {
      await db
        .update(contacts)
        .set({
          firstName: contactData.firstName || contact.firstName,
          lastName: contactData.lastName || contact.lastName,
          middleName: contactData.middleName,
          genderId: contactData.genderId,
          raceId: contactData.raceId,
          pronouns: contactData.pronouns,
          vanid: contactData.vanid,
          status: contactData.status || contact.status,
          updatedById: user.id,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contactId));
    }
    
    // Handle emails: keep existing ones and add/update/delete as needed
    if (emails) {
      console.log('Processing email updates:', emails);
      
      // Filter out valid emails
      const validEmails = emails.filter(email => email.email && email.email.trim() !== '');
      
      if (validEmails.length > 0) {
        // For each email, check if it's new, modified or deleted
        for (const email of validEmails) {
          if (email.isNew) {
            // Add new email
            console.log('Adding new email:', email.email);
            await db.insert(contactEmails).values({
              contactId: contactId,
              email: email.email,
              status: email.status || 'active',
              createdById: user.id,
              updatedById: user.id,
            });
          } else if (email.isModified && email.id) {
            // Update existing email
            console.log('Updating email with ID:', email.id);
            await db
              .update(contactEmails)
              .set({
                email: email.email,
                status: email.status || 'active',
                updatedById: user.id,
                updatedAt: new Date(),
              })
              .where(eq(contactEmails.id, email.id));
          } else if (email.isDeleted && email.id) {
            // Delete email
            console.log('Deleting email with ID:', email.id);
            await db
              .delete(contactEmails)
              .where(eq(contactEmails.id, email.id));
          }
        }
      }
    }
    
    // Handle phone numbers: keep existing ones and add new ones
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
            await db.insert(contactPhoneNumbers).values({
              contactId: contactId,
              phoneNumber: phone.phoneNumber,
              status: phone.status || 'active',
              createdById: user.id,
              updatedById: user.id,
            });
          } else if (phone.isModified && phone.id) {
            // Update existing phone number
            console.log('Updating phone number with ID:', phone.id);
            await db
              .update(contactPhoneNumbers)
              .set({
                phoneNumber: phone.phoneNumber,
                status: phone.status || 'active',
                updatedById: user.id,
                updatedAt: new Date(),
              })
              .where(eq(contactPhoneNumbers.id, phone.id));
          } else if (phone.isDeleted && phone.id) {
            // Delete phone number
            console.log('Deleting phone number with ID:', phone.id);
            await db
              .delete(contactPhoneNumbers)
              .where(eq(contactPhoneNumbers.id, phone.id));
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
              .delete(contactAddresses)
              .where(eq(contactAddresses.id, address.id));
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
              await db.insert(contactAddresses).values({
                contactId: contactId,
                streetAddress: address.streetAddress,
                secondaryStreetAddress: address.secondaryStreetAddress || null,
                city: address.city,
                stateId: address.stateId,
                zipCodeId: zipCodeId,
                status: address.status || 'active',
                createdById: user.id,
                updatedById: user.id,
              });
            } else if (address.isModified && address.id) {
              // Update existing address
              console.log('Updating address with ID:', address.id);
              await db
                .update(contactAddresses)
                .set({
                  streetAddress: address.streetAddress,
                  secondaryStreetAddress: address.secondaryStreetAddress || null,
                  city: address.city,
                  stateId: address.stateId,
                  zipCodeId: zipCodeId,
                  status: address.status || 'active',
                  updatedById: user.id,
                  updatedAt: new Date(),
                })
                .where(eq(contactAddresses.id, address.id));
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
            await db.insert(contactSocialMediaAccounts).values({
              contactId: contactId,
              serviceType: account.serviceType,
              socialMediaAccount: account.socialMediaAccount,
              status: account.status || 'active',
              createdById: user.id,
              updatedById: user.id,
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
                updatedById: user.id,
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
    
    const updatedAddresses = await db
      .select()
      .from(contactAddresses)
      .where(eq(contactAddresses.contactId, contactId));
    
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
    
    throw error(500, 'Failed to update contact');
  }
};

// DELETE /api/contacts/[id] - Delete a contact
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  const contactId = params.id;
  
  try {
    // Check workspace access
    await checkWorkspaceAccess(user.id, contactId);
    
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
