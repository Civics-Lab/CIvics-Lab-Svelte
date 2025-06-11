/**
 * Service for contact-related API calls
 */

import type { Contact } from '$lib/types/contact';

export interface PaginatedContactsResponse {
  contacts: Contact[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ContactFetchOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: any[];
  sorting?: any[];
}

/**
 * Fetch all contacts for a workspace (legacy function - returns all contacts)
 */
export async function fetchContacts(workspaceId: string): Promise<Contact[]> {
  try {
    // Use a high limit to get all contacts for client-side filtering
    // Set limit to 10000 to accommodate large workspaces
    const response = await fetch(`/api/contacts?workspace_id=${workspaceId}&limit=10000`);
    
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
 * Fetch paginated contacts for a workspace
 */
export async function fetchPaginatedContacts(
  workspaceId: string, 
  options: ContactFetchOptions = {}
): Promise<PaginatedContactsResponse> {
  try {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      ...(options.page && { page: options.page.toString() }),
      ...(options.pageSize && { page_size: options.pageSize.toString() }),
      ...(options.search && { search: options.search }),
      ...(options.filters && { filters: JSON.stringify(options.filters) }),
      ...(options.sorting && { sorting: JSON.stringify(options.sorting) })
    });

    const response = await fetch(`/api/contacts/paginated?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch contacts');
    }
    
    const data = await response.json();
    return {
      contacts: data.contacts,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error in fetchPaginatedContacts:', error);
    throw error;
  }
}

/**
 * Fetch a specific contact
 */
export async function fetchContact(contactId: string): Promise<Contact> {
  try {
    console.log('Fetching contact with ID:', contactId);
    
    const response = await fetch(`/api/contacts/${contactId}`);
    console.log('Contact API response status:', response.status);
    
    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.message || 'Failed to fetch contact');
      } catch (jsonError) {
        // If the response body isn't valid JSON
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`Failed to fetch contact: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log('Contact API response data:', data);
    
    if (!data.contact) {
      console.error('No contact data in API response');
      throw new Error('Failed to fetch contact: No contact data in response');
    }
    
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
    // Log inputs for debugging
    console.log('Contact service received data:', contactData);
    
    // Create a clean payload mapping all snake_case to camelCase correctly
    const apiPayload = {
      workspaceId: contactData.workspaceId,
      
      // Map contact basic info
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
      
      // Map emails (these usually don't have issues)
      emails: contactData.emails?.map(email => ({
        email: email.email,
        status: email.status
      })),
      
      // Map phone numbers - ensure we're using consistent property naming
      phoneNumbers: contactData.phoneNumbers?.map(phone => ({
        // The ContactFormModal uses phone_number but the API expects phoneNumber
        phoneNumber: phone.phoneNumber || phone.phone_number,
        status: phone.status
      })),
      
      // Map addresses from snake_case to camelCase
      addresses: contactData.addresses?.map(address => ({
        streetAddress: address.streetAddress || address.street_address,
        secondaryStreetAddress: address.secondaryStreetAddress || address.secondary_street_address,
        city: address.city,
        stateId: address.stateId || address.state_id,
        zipCode: address.zipCode || address.zip_code,
        status: address.status
      })),
      
      // Map social media from snake_case to camelCase
      socialMedia: contactData.socialMedia?.map(social => ({
        socialMediaAccount: social.socialMediaAccount || social.social_media_account,
        serviceType: social.serviceType || social.service_type,
        status: social.status
      })),
      
      // Tags don't need mapping
      tags: contactData.tags
    };
    
    console.log('Sending API payload:', apiPayload);
    
    const response = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.message || 'Failed to create contact');
      } catch (jsonError) {
        // If the response body isn't valid JSON
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`Failed to create contact: ${response.status} ${response.statusText}`);
      }
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
    // Create a clean payload mapping all snake_case to camelCase correctly
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
      
      // Map emails from snake_case to camelCase
      // Also preserve isNew, isModified, and isDeleted flags for server-side logic
      emails: updateData.emails
        ?.filter(email => {
          // Always include emails marked for deletion
          if (email.isDeleted) return true;
          // Filter out empty emails
          return email.email && email.email.trim() !== '';
        })
        .map(email => ({
          id: email.id, // Preserve ID for existing emails
          email: email.email, 
          status: email.status || 'active',
          isNew: email.isNew === true, // Ensure boolean value
          isModified: email.isModified === true, // Ensure boolean value
          isDeleted: email.isDeleted === true // Ensure boolean value
        })),
      
      // Map phone numbers - ensure we're using consistent property naming
      // Also filter out any invalid phone numbers to prevent DB errors
      // Preserve isNew, isModified, and isDeleted flags for server-side logic
      phoneNumbers: updateData.phoneNumbers
        ?.filter(phone => {
          // Keep deleted items even if empty (they need to be removed)
          if (phone.isDeleted) return true;
          // Filter out empty non-deleted items
          // Check both potential property names
          const phoneNumber = phone.phoneNumber || phone.phone_number || '';
          return phoneNumber.trim() !== '';
        })
        .map(phone => ({
          id: phone.id, // Preserve ID for existing phone numbers
          phoneNumber: phone.phoneNumber || phone.phone_number, // Handle both property name formats
          status: phone.status,
          isNew: phone.isNew,
          isModified: phone.isModified,
          isDeleted: phone.isDeleted
        })),
      
      // Map addresses from snake_case to camelCase
      // Also preserve isNew, isModified, and isDeleted flags for server-side logic
      addresses: updateData.addresses
        ?.filter(address => {
          // Keep deleted items even if empty (they need to be removed)
          if (address.isDeleted) return true;
          // Filter out empty non-deleted items
          // Check both potential property names
          const streetAddress = address.streetAddress || address.street_address || '';
          return streetAddress.trim() !== '' && address.city && address.city.trim() !== '';
        })
        .map(address => ({
          id: address.id, // Preserve ID for existing addresses
          streetAddress: address.streetAddress || address.street_address,
          secondaryStreetAddress: address.secondaryStreetAddress || address.secondary_street_address,
          city: address.city,
          stateId: address.stateId || address.state_id,
          zipCode: address.zipCode || address.zip_code,
          status: address.status,
          isNew: address.isNew,
          isModified: address.isModified,
          isDeleted: address.isDeleted
        })),
      
      // Map social media from snake_case to camelCase
      // Also preserve isNew, isModified, and isDeleted flags for server-side logic
      socialMedia: updateData.socialMedia
        ?.filter(social => {
          // Keep deleted items even if empty (they need to be removed)
          if (social.isDeleted) return true;
          // Filter out empty non-deleted items
          // Check both potential property names
          const account = social.socialMediaAccount || social.social_media_account || '';
          return account.trim() !== '' && (social.serviceType || social.service_type);
        })
        .map(social => ({
          id: social.id, // Preserve ID for existing social media accounts
          socialMediaAccount: social.socialMediaAccount || social.social_media_account,
          serviceType: social.serviceType || social.service_type,
          status: social.status,
          isNew: social.isNew,
          isModified: social.isModified,
          isDeleted: social.isDeleted
        })),
      
      // Tags don't need mapping
      tags: updateData.tags
    };
    
    console.log('Sending update payload:', apiPayload);
    
    const response = await fetch(`/api/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });
    
    console.log('Update API response status:', response.status);
    
    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error('API update error raw response:', errorText);
        
        // Try to parse as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          console.error('API update error parsed JSON:', errorJson);
          throw new Error(errorJson.message || 'Failed to update contact');
        } catch (parseError) {
          // Response wasn't valid JSON
          console.error('Response was not valid JSON:', parseError);
          throw new Error(`Failed to update contact: ${response.status} ${response.statusText}`);
        }
      } catch (responseError) {
        // If we couldn't even get the response text
        console.error('Failed to get error response text:', responseError);
        throw new Error(`Failed to update contact: ${response.status} ${response.statusText}`);
      }
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
