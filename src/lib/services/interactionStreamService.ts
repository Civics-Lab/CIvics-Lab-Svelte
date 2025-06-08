// Service for managing interaction streams
import { browser } from '$app/environment';

export interface InteractionStream {
  id?: string;
  workspaceId: string;
  contactId?: string | null;
  businessId?: string | null;
  interactionType: 'note' | 'call' | 'email' | 'in_person';
  title: string;
  content: string;
  interactionDate: Date | string;
  status?: 'active' | 'archived' | 'deleted';
  metadata?: any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdById?: string;
  // Related entity info
  contactFirstName?: string;
  contactLastName?: string;
  businessName?: string;
}

export interface CreateInteractionStreamData {
  workspaceId: string;
  contactId?: string;
  businessId?: string;
  interactionType: 'note' | 'call' | 'email' | 'in_person';
  title: string;
  content: string;
  interactionDate?: Date | string;
  metadata?: any;
}

export interface UpdateInteractionStreamData {
  interactionType?: 'note' | 'call' | 'email' | 'in_person';
  title?: string;
  content?: string;
  interactionDate?: Date | string;
  status?: 'active' | 'archived' | 'deleted';
  metadata?: any;
}

/**
 * Fetch interaction streams for a workspace, contact, or business
 */
export async function fetchInteractionStreams(
  workspaceId: string,
  options: {
    contactId?: string;
    businessId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<InteractionStream[]> {
  if (!browser) return [];

  try {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
    });

    if (options.contactId) {
      params.append('contact_id', options.contactId);
    }

    if (options.businessId) {
      params.append('business_id', options.businessId);
    }

    const response = await fetch(`/api/interaction-streams?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch interaction streams');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching interaction streams:', error);
    throw error;
  }
}

/**
 * Fetch a specific interaction stream by ID
 */
export async function fetchInteractionStream(id: string): Promise<InteractionStream> {
  if (!browser) throw new Error('Not in browser environment');

  try {
    const response = await fetch(`/api/interaction-streams/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch interaction stream');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching interaction stream:', error);
    throw error;
  }
}

/**
 * Create a new interaction stream
 */
export async function createInteractionStream(data: CreateInteractionStreamData): Promise<InteractionStream> {
  if (!browser) throw new Error('Not in browser environment');

  try {
    const response = await fetch('/api/interaction-streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create interaction stream');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating interaction stream:', error);
    throw error;
  }
}

/**
 * Update an existing interaction stream
 */
export async function updateInteractionStream(
  id: string,
  data: UpdateInteractionStreamData
): Promise<InteractionStream> {
  if (!browser) throw new Error('Not in browser environment');

  try {
    const response = await fetch(`/api/interaction-streams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update interaction stream');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating interaction stream:', error);
    throw error;
  }
}

/**
 * Delete an interaction stream (soft delete)
 */
export async function deleteInteractionStream(id: string): Promise<void> {
  if (!browser) throw new Error('Not in browser environment');

  console.log('deleteInteractionStream called with ID:', id);

  try {
    console.log('Making DELETE request to:', `/api/interaction-streams/${id}`);
    const response = await fetch(`/api/interaction-streams/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('DELETE response status:', response.status);
    console.log('DELETE response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DELETE request failed with error data:', errorData);
      throw new Error(errorData.error || 'Failed to delete interaction stream');
    }
    
    console.log('Delete request successful');
  } catch (error) {
    console.error('Error in deleteInteractionStream service:', error);
    throw error;
  }
}

/**
 * Get recent interaction streams across the workspace for dashboard timeline
 */
export async function fetchRecentWorkspaceStreams(
  workspaceId: string,
  limit: number = 20
): Promise<InteractionStream[]> {
  return fetchInteractionStreams(workspaceId, { limit });
}