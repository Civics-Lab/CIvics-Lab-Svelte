/**
 * Service for contact-related API calls
 */

import type { Contact } from '$lib/types/contact';

/**
 * Fetch all contacts for a workspace
 */
export async function fetchContacts(workspaceId: string): Promise<Contact[]> {
  try {
    const response = await fetch(`/api/contacts?workspace_id=${workspaceId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contacts');
    }
    
    const data = await response.json();
    return data.contacts;
  } catch (error) {
    console.error('Error in fetchContacts:', error);
    throw error;
  }
}

/**
 * Fetch a specific contact
 */
export async function fetchContact(contactId: string): Promise<Contact> {
  try {
    const response = await fetch(`/api/contacts/${contactId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contact');
    }
    
    const data = await response.json();
    return data.contact;
  } catch (error) {
    console.error('Error in fetchContact:', error);
    throw error;
  }
}

/**
 * Create a new contact
 */
export async function createContact(contactData: {
  workspaceId: string;
  contact: any;
  emails?: any[];
  phoneNumbers?: any[];
  addresses?: any[];
  socialMedia?: any[];
  tags?: string[];
}): Promise<Contact> {
  try {
    // Map the client-side schema to the API schema
    const apiPayload = {
      workspaceId: contactData.workspaceId,
      contact: {
        firstName: contactData.contact.firstName,
        lastName: contactData.contact.lastName,
        middleName: contactData.contact.middleName,
        genderId: contactData.contact.genderId,
        raceId: contactData.contact.raceId,
        pronouns: contactData.contact.pronouns,
        vanid: contactData.contact.vanid,
        status: contactData.contact.status
      },
      emails: contactData.emails?.map(email => ({ email: email.email, status: email.status })),
      phoneNumbers: contactData.phoneNumbers?.map(phone => ({ phoneNumber: phone.phoneNumber, status: phone.status })),
      addresses: contactData.addresses?.map(address => ({
        streetAddress: address.streetAddress,
        secondaryStreetAddress: address.secondaryStreetAddress,
        city: address.city,
        stateId: address.stateId,
        zipCodeId: null, // API handles zipCode creation
        zipCode: address.zipCode, // Pass zipCode as a separate field for the API to process
        status: address.status
      })),
      socialMedia: contactData.socialMedia?.map(social => ({
        socialMediaAccount: social.socialMediaAccount,
        serviceType: social.serviceType,
        status: social.status
      })),
      tags: contactData.tags
    };
    
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create contact');
    }
    
    const data = await response.json();
    return data.contact;
  } catch (error) {
    console.error('Error in createContact:', error);
    throw error;
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(contactId: string, updateData: {
  contactData?: any;
  emails?: any[];
  phoneNumbers?: any[];
  addresses?: any[];
  socialMedia?: any[];
  tags?: string[];
}): Promise<Contact> {
  try {
    // Map the client-side schema to the API schema
    const apiPayload = {
      contactData: updateData.contactData ? {
        firstName: updateData.contactData.firstName,
        lastName: updateData.contactData.lastName,
        middleName: updateData.contactData.middleName,
        genderId: updateData.contactData.genderId,
        raceId: updateData.contactData.raceId,
        pronouns: updateData.contactData.pronouns,
        vanid: updateData.contactData.vanid,
        status: updateData.contactData.status
      } : undefined,
      emails: updateData.emails?.map(email => ({ email: email.email, status: email.status })),
      phoneNumbers: updateData.phoneNumbers?.map(phone => ({ phoneNumber: phone.phoneNumber, status: phone.status })),
      addresses: updateData.addresses?.map(address => ({
        streetAddress: address.streetAddress,
        secondaryStreetAddress: address.secondaryStreetAddress,
        city: address.city,
        stateId: address.stateId,
        zipCodeId: null, // API handles zipCode creation
        zipCode: address.zipCode, // Pass zipCode as a separate field for the API to process
        status: address.status
      })),
      socialMedia: updateData.socialMedia?.map(social => ({
        socialMediaAccount: social.socialMediaAccount,
        serviceType: social.serviceType,
        status: social.status
      })),
      tags: updateData.tags
    };
    
    const response = await fetch(`/api/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update contact');
    }
    
    const data = await response.json();
    return data.contact;
  } catch (error) {
    console.error('Error in updateContact:', error);
    throw error;
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(contactId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/contacts/${contactId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete contact');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteContact:', error);
    throw error;
  }
}
