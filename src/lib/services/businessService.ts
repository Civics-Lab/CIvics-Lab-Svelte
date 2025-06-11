/**
 * Service for business-related API calls
 */

export interface PaginatedBusinessesResponse {
  businesses: any[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface BusinessFetchOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: any[];
  sorting?: any[];
}

/**
 * Fetch all businesses for a workspace (legacy function - returns all businesses)
 */
export async function fetchBusinesses(workspaceId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/businesses?workspace_id=${workspaceId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch businesses');
    }
    
    const data = await response.json();
    return data.businesses;
  } catch (error) {
    console.error('Error in fetchBusinesses:', error);
    throw error;
  }
}

/**
 * Fetch paginated businesses for a workspace
 */
export async function fetchPaginatedBusinesses(
  workspaceId: string,
  options: BusinessFetchOptions = {}
): Promise<PaginatedBusinessesResponse> {
  try {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      ...(options.page && { page: options.page.toString() }),
      ...(options.pageSize && { page_size: options.pageSize.toString() }),
      ...(options.search && { search: options.search }),
      ...(options.filters && { filters: JSON.stringify(options.filters) }),
      ...(options.sorting && { sorting: JSON.stringify(options.sorting) })
    });

    const response = await fetch(`/api/businesses/paginated?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch businesses');
    }
    
    const data = await response.json();
    return {
      businesses: data.businesses,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error in fetchPaginatedBusinesses:', error);
    throw error;
  }
}

/**
 * Fetch a specific business
 */
export async function fetchBusiness(businessId: string): Promise<any> {
  try {
    console.log('Fetching business with ID:', businessId);
    
    const response = await fetch(`/api/businesses/${businessId}`);
    console.log('Business API response status:', response.status);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch business');
      } catch (jsonError) {
        // If the response body isn't valid JSON or another error occurs
        console.error('Failed to parse error response or other error:', jsonError);
        throw new Error(`Failed to fetch business: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log('Business API response data:', data);
    
    if (!data.business) {
      console.error('No business data in API response');
      throw new Error('Failed to fetch business: No business data in response');
    }
    
    // Add workspace ID to the business object for reference
    const business = data.business;
    
    // Make sure related collections are arrays even if empty
    business.phoneNumbers = business.phoneNumbers || [];
    business.addresses = business.addresses || [];
    business.socialMediaAccounts = business.socialMediaAccounts || [];
    business.employees = business.employees || [];
    business.tags = business.tags || [];
    
    return business;
  } catch (error) {
    console.error('Error in fetchBusiness:', error);
    throw error;
  }
}

/**
 * Create a new business
 */
export async function createBusiness(businessData: {
  workspaceId: string;
  business: any;
  phoneNumbers?: any[];
  addresses?: any[];
  socialMedia?: any[];
  employees?: any[];
  tags?: string[];
}): Promise<any> {
  try {
    // Log inputs for debugging
    console.log('Business service received data:', businessData);
    
    // Create a clean payload mapping all snake_case to camelCase correctly
    const apiPayload = {
      workspaceId: businessData.workspaceId,
      
      // Map business basic info
      business: {
        businessName: businessData.business.business_name,
        status: businessData.business.status
      },
      
      // Map phone numbers from snake_case to camelCase
      phoneNumbers: businessData.phoneNumbers?.map(phone => ({
        phoneNumber: phone.phone_number,
        status: phone.status
      })),
      
      // Map addresses from snake_case to camelCase
      addresses: businessData.addresses?.map(address => ({
        streetAddress: address.street_address,
        secondaryStreetAddress: address.secondary_street_address,
        city: address.city,
        stateId: address.state_id,
        zipCode: address.zip_code,
        status: address.status
      })),
      
      // Map social media from snake_case to camelCase
      socialMedia: businessData.socialMedia?.map(social => ({
        socialMediaAccount: social.social_media_account,
        serviceType: social.service_type,
        status: social.status
      })),
      
      // Map employees
      employees: businessData.employees?.map(employee => ({
        contactId: employee.contact_id,
        status: employee.status,
        role: employee.role || '' // Include role for UI display
      })),
      
      // Tags don't need mapping
      tags: businessData.tags
    };
    
    console.log('Sending API payload:', apiPayload);
    
    const response = await fetch('/api/businesses', {
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
        throw new Error(error.message || 'Failed to create business');
      } catch (jsonError) {
        // If the response body isn't valid JSON
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`Failed to create business: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.business;
  } catch (error) {
    console.error('Error in createBusiness:', error);
    throw error;
  }
}

/**
 * Update an existing business
 */
export async function updateBusiness(businessId: string, updateData: {
  businessData?: any;
  phoneNumbers?: any[];
  addresses?: any[];
  socialMedia?: any[];
  employees?: any[];
  tags?: string[];
}): Promise<any> {
  try {
    // Create a clean payload mapping all snake_case to camelCase correctly
    const apiPayload = {
      businessData: updateData.businessData ? {
        businessName: updateData.businessData.business_name,
        status: updateData.businessData.status
      } : undefined,
      
      // Map phone numbers from snake_case to camelCase
      // Also filter out any invalid phone numbers to prevent DB errors
      // Preserve isNew, isModified, and isDeleted flags for server-side logic
      phoneNumbers: updateData.phoneNumbers
        ?.filter(phone => {
          // Keep deleted items even if empty (they need to be removed)
          if (phone.isDeleted) return true;
          // Filter out empty non-deleted items
          return phone.phone_number && phone.phone_number.trim() !== '';
        })
        .map(phone => ({
          id: phone.id, // Preserve ID for existing phone numbers
          phoneNumber: phone.phone_number,
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
          return address.street_address && address.street_address.trim() !== '';
        })
        .map(address => ({
          id: address.id, // Preserve ID for existing addresses
          streetAddress: address.street_address,
          secondaryStreetAddress: address.secondary_street_address,
          city: address.city,
          stateId: address.state_id,
          zipCode: address.zip_code,
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
          return social.social_media_account && social.social_media_account.trim() !== '';
        })
        .map(social => ({
          id: social.id, // Preserve ID for existing social media accounts
          socialMediaAccount: social.social_media_account,
          serviceType: social.service_type,
          status: social.status,
          isNew: social.isNew,
          isModified: social.isModified,
          isDeleted: social.isDeleted
        })),
        
      // Map employees
      // Also preserve isNew, isModified, and isDeleted flags for server-side logic
      employees: updateData.employees
        ?.filter(employee => {
          // Keep deleted items even if empty (they need to be removed)
          if (employee.isDeleted) return true;
          // Filter out empty non-deleted items
          return employee.contact_id && employee.contact_id.trim() !== '';
        })
        .map(employee => ({
          id: employee.id, // Preserve ID for existing employees
          contactId: employee.contact_id,
          status: employee.status,
          role: employee.role || '', // Include role for UI display
          isNew: employee.isNew,
          isModified: employee.isModified,
          isDeleted: employee.isDeleted
        })),
      
      // Tags don't need mapping
      tags: updateData.tags
    };
    
    console.log('Sending update payload to API:', apiPayload);
    
    const response = await fetch(`/api/businesses/${businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(apiPayload)
    });
    
    console.log('Update API response status:', response.status);
    
    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('API update error response:', error);
        throw new Error(error.message || 'Failed to update business');
      } catch (jsonError) {
        // If the response body isn't valid JSON
        console.error('Failed to parse update error response:', jsonError);
        throw new Error(`Failed to update business: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    // Make sure related collections are arrays even if empty
    if (data.business) {
      data.business.phoneNumbers = data.business.phoneNumbers || [];
      data.business.addresses = data.business.addresses || [];
      data.business.socialMediaAccounts = data.business.socialMediaAccounts || [];
      data.business.employees = data.business.employees || [];
      data.business.tags = data.business.tags || [];
    }
    
    return data.business;
  } catch (error) {
    console.error('Error in updateBusiness:', error);
    throw error;
  }
}

/**
 * Delete a business
 */
export async function deleteBusiness(businessId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/businesses/${businessId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete business');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteBusiness:', error);
    throw error;
  }
}
