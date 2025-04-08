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
  
  try {
    // Check workspace access and get contact
    const { contact } = await checkWorkspaceAccess(user.id, contactId);
    
    // Get emails
    const emails = await db
      .select()
      .from(contactEmails)
      .where(eq(contactEmails.contactId, contactId));
    
    // Get phone numbers
    const phoneNumbers = await db
      .select()
      .from(contactPhoneNumbers)
      .where(eq(contactPhoneNumbers.contactId, contactId));
    
    // Get addresses
    const addresses = await db
      .select()
      .from(contactAddresses)
      .where(eq(contactAddresses.contactId, contactId));
    
    // Get social media accounts
    const socialMedia = await db
      .select()
      .from(contactSocialMediaAccounts)
      .where(eq(contactSocialMediaAccounts.contactId, contactId));
    
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
    
    // Return enhanced contact with related data
    return json({
      contact: {
        ...contact,
        emails: emails || [],
        phoneNumbers: phoneNumbers || [],
        addresses: addresses || [],
        socialMediaAccounts: socialMedia || [],
        tags: tags || [],
      }
    });
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
    
    // Handle emails: remove existing ones and add new ones if provided
    if (emails) {
      // Delete existing emails
      await db
        .delete(contactEmails)
        .where(eq(contactEmails.contactId, contactId));
      
      // Add new emails
      if (emails.length > 0) {
        await db.insert(contactEmails).values(
          emails.map((email) => ({
            contactId: contactId,
            email: email.email,
            status: email.status || 'active',
            createdById: user.id,
            updatedById: user.id,
          }))
        );
      }
    }
    
    // Handle phone numbers: remove existing ones and add new ones if provided
    if (phoneNumbers) {
      // Delete existing phone numbers
      await db
        .delete(contactPhoneNumbers)
        .where(eq(contactPhoneNumbers.contactId, contactId));
      
      // Add new phone numbers
      if (phoneNumbers.length > 0) {
        await db.insert(contactPhoneNumbers).values(
          phoneNumbers.map((phone) => ({
            contactId: contactId,
            phoneNumber: phone.phoneNumber,
            status: phone.status || 'active',
            createdById: user.id,
            updatedById: user.id,
          }))
        );
      }
    }
    
    // Handle addresses: remove existing ones and add new ones if provided
    if (addresses) {
      // Delete existing addresses
      await db
        .delete(contactAddresses)
        .where(eq(contactAddresses.contactId, contactId));
      
      // Add new addresses
      if (addresses.length > 0) {
        // Process each address individually to handle zipCode creation
        for (const address of addresses) {
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
        }
      }
    }
    
    // Handle social media accounts: remove existing ones and add new ones if provided
    if (socialMedia) {
      // Delete existing social media accounts
      await db
        .delete(contactSocialMediaAccounts)
        .where(eq(contactSocialMediaAccounts.contactId, contactId));
      
      // Add new social media accounts
      if (socialMedia.length > 0) {
        await db.insert(contactSocialMediaAccounts).values(
          socialMedia.map((account) => ({
            contactId: contactId,
            serviceType: account.serviceType,
            socialMediaAccount: account.socialMediaAccount,
            status: account.status || 'active',
            createdById: user.id,
            updatedById: user.id,
          }))
        );
      }
    }
    
    // Handle tags: remove existing ones and add new ones if provided
    if (tags) {
      // Delete existing tags
      await db
        .delete(contactTags)
        .where(
          and(
            eq(contactTags.contactId, contactId),
            eq(contactTags.workspaceId, contact.workspaceId)
          )
        );
      
      // Add new tags
      if (tags.length > 0) {
        await db.insert(contactTags).values(
          tags.map((tag) => ({
            contactId: contactId,
            workspaceId: contact.workspaceId,
            tag: tag,
          }))
        );
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
