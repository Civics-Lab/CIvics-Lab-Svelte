/**
 * Service for donation-related API calls
 */

import type { Donation } from '$lib/types/donation';

/**
 * Fetch donations for a specific contact
 */
export async function fetchContactDonations(contactId: string): Promise<Donation[]> {
  try {
    console.log('Fetching donations for contact ID:', contactId);
    
    const response = await fetch(`/api/contacts/${contactId}/donations`);
    console.log('Donations API response status:', response.status);
    
    if (!response.ok) {
      try {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(error.message || 'Failed to fetch donations');
      } catch (jsonError) {
        // If the response body isn't valid JSON
        console.error('Failed to parse error response:', jsonError);
        throw new Error(`Failed to fetch donations: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log(`Found ${data.donations?.length || 0} donations for contact`);
    
    return data.donations || [];
  } catch (error) {
    console.error('Error in fetchContactDonations:', error);
    throw error;
  }
}

/**
 * Create a new donation for a contact
 */
export async function createDonation(contactId: string, donationData: {
  amount: number;
  status: string;
}): Promise<Donation> {
  try {
    const response = await fetch(`/api/contacts/${contactId}/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donationData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create donation');
    }
    
    const data = await response.json();
    return data.donation;
  } catch (error) {
    console.error('Error in createDonation:', error);
    throw error;
  }
}

/**
 * Update a donation
 */
export async function updateDonation(donationId: string, updateData: {
  amount?: number;
  status?: string;
}): Promise<Donation> {
  try {
    const response = await fetch(`/api/donations/${donationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update donation');
    }
    
    const data = await response.json();
    return data.donation;
  } catch (error) {
    console.error('Error in updateDonation:', error);
    throw error;
  }
}

/**
 * Delete a donation
 */
export async function deleteDonation(donationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/donations/${donationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete donation');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteDonation:', error);
    throw error;
  }
}
