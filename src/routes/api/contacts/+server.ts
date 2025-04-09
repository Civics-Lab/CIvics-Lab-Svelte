import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { contacts, userWorkspaces, contactEmails, contactPhoneNumbers, contactAddresses, contactSocialMediaAccounts, contactTags, zipCodes } from '$lib/db/drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/contacts - Get all contacts for the current user's workspace
export const GET: RequestHandler = async ({ locals, url }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // Get workspace ID from query parameter or throw an error
    const workspaceId = url.searchParams.get('workspace_id');
    
    if (!workspaceId) {
      throw error(400, 'Workspace ID is required');
    }
    
    // Check if the user has access to this workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, user.id),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      throw error(403, 'You do not have access to this workspace');
    }
    
    // Get all contacts for the workspace
    const contactsList = await db
      .select()
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
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
        
        // Get tags - explicitly filter by workspace
        const tags = await db
          .select()
          .from(contactTags)
          .where(
            and(
              eq(contactTags.contactId, contact.id),
              eq(contactTags.workspaceId, workspaceId)
            )
          );
        
        // Return enhanced contact with related data
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
    
    return json({ contacts: enhancedContacts });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    throw error(500, 'Failed to fetch contacts');
  }
};

// POST /api/contacts - Create a new contact
export const POST: RequestHandler = async ({ request, locals }) => {
  // Get the authenticated user from locals
  const user = locals.user;
  
  if (!user) {
    throw error(401, 'Authentication required');
  }
  
  try {
    // Get the contact data from the request body
    const requestData = await request.json();
    console.log('API received request data:', JSON.stringify(requestData, null, 2));
    
    const { workspaceId, contact, emails, phoneNumbers, addresses, socialMedia, tags } = requestData;
    
    console.log('API destructured data:', {
      workspaceId,
      contact,
      emailsCount: emails?.length,
      phoneNumbersCount: phoneNumbers?.length,
      addressesCount: addresses?.length,
      socialMediaCount: socialMedia?.length,
      tagsCount: tags?.length
    });
    
    if (!workspaceId) {
      throw error(400, 'Workspace ID is required');
    }
    
    if (!contact || !contact.firstName || !contact.lastName) {
      throw error(400, 'First name and last name are required');
    }
    
    // Check if the user has access to this workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, user.id),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      )
      .limit(1);
    
    if (!userWorkspace || userWorkspace.length === 0) {
      throw error(403, 'You do not have access to this workspace');
    }
    
    // Create the contact
    const [newContact] = await db
      .insert(contacts)
      .values({
        firstName: contact.firstName,
        lastName: contact.lastName,
        middleName: contact.middleName || null,
        genderId: contact.genderId || null,
        raceId: contact.raceId || null,
        pronouns: contact.pronouns || null,
        vanid: contact.vanid || null,
        workspaceId: workspaceId,
        createdById: user.id,
        updatedById: user.id,
      })
      .returning();
    
    if (!newContact) {
      throw error(500, 'Failed to create contact');
    }
    
    // Create emails if provided
    if (emails && emails.length > 0) {
      await db.insert(contactEmails).values(
        emails.map((email) => ({
          contactId: newContact.id,
          email: email.email,
          status: email.status || 'active',
          createdById: user.id,
          updatedById: user.id,
        }))
      );
    }
    
    // Create phone numbers if provided
    if (phoneNumbers && phoneNumbers.length > 0) {
      // Validate phoneNumbers to avoid undefined errors
      const validPhones = phoneNumbers.filter(phone => phone && phone.phoneNumber);
      if (validPhones.length > 0) {
        await db.insert(contactPhoneNumbers).values(
          validPhones.map((phone) => ({
            contactId: newContact.id,
            phoneNumber: phone.phoneNumber,
            status: phone.status || 'active',
            createdById: user.id,
            updatedById: user.id,
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
        await db.insert(contactAddresses).values({
          contactId: newContact.id,
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
    
    // Create social media accounts if provided
    if (socialMedia && socialMedia.length > 0) {
      // Validate social media entries
      const validSocial = socialMedia.filter(account => account && account.socialMediaAccount && account.serviceType);
      
      if (validSocial.length > 0) {
        await db.insert(contactSocialMediaAccounts).values(
          validSocial.map((account) => ({
            contactId: newContact.id,
            serviceType: account.serviceType,
            socialMediaAccount: account.socialMediaAccount,
            status: account.status || 'active',
            createdById: user.id,
            updatedById: user.id,
          }))
        );
      } else {
        console.log('No valid social media accounts to insert');
      }
    }
    
    // Create tags if provided
    if (tags && tags.length > 0) {
      await db.insert(contactTags).values(
        tags.map((tag) => ({
          contactId: newContact.id,
          workspaceId: workspaceId,
          tag: tag,
        }))
      );
    }
    
    // Fetch the complete contact with all related data
    const emailsList = await db
      .select()
      .from(contactEmails)
      .where(eq(contactEmails.contactId, newContact.id));
      
    if (!emailsList) {
      console.error('Failed to fetch emails for contact:', newContact.id);
    }
    
    const phonesList = await db
      .select()
      .from(contactPhoneNumbers)
      .where(eq(contactPhoneNumbers.contactId, newContact.id));
    
    const addressesList = await db
      .select()
      .from(contactAddresses)
      .where(eq(contactAddresses.contactId, newContact.id));
    
    const socialMediaList = await db
      .select()
      .from(contactSocialMediaAccounts)
      .where(eq(contactSocialMediaAccounts.contactId, newContact.id));
    
    const tagsList = await db
      .select()
      .from(contactTags)
      .where(
        and(
          eq(contactTags.contactId, newContact.id),
          eq(contactTags.workspaceId, workspaceId)
        )
      );
    
    // Return the created contact with all related data
    return json({
      contact: {
        ...newContact,
        emails: emailsList || [],
        phoneNumbers: phonesList || [],
        addresses: addressesList || [],
        socialMediaAccounts: socialMediaList || [],
        tags: tagsList || [],
      }
    }, { status: 201 });
  } catch (err) {
    console.error('Error creating contact:', err);
    
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
    
    throw error(500, `Failed to create contact: ${err.message || 'Unknown error'}`);
  }
};
