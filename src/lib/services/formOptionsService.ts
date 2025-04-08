/**
 * Service for fetching form options
 */

import type { Gender, Race, State } from '$lib/types/contact';

interface FormOptions {
  genders: Gender[];
  races: Race[];
  states: State[];
  tags: string[];
}

/**
 * Fetch all form options
 */
export async function fetchFormOptions(workspaceId?: string): Promise<FormOptions> {
  try {
    const url = workspaceId 
      ? `/api/form-options?workspace_id=${workspaceId}`
      : '/api/form-options';
      
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch form options');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in fetchFormOptions:', error);
    throw error;
  }
}

/**
 * Fetch genders
 */
export async function fetchGenders(): Promise<Gender[]> {
  try {
    const options = await fetchFormOptions();
    return options.genders;
  } catch (error) {
    console.error('Error in fetchGenders:', error);
    throw error;
  }
}

/**
 * Fetch races
 */
export async function fetchRaces(): Promise<Race[]> {
  try {
    const options = await fetchFormOptions();
    return options.races;
  } catch (error) {
    console.error('Error in fetchRaces:', error);
    throw error;
  }
}

/**
 * Fetch states
 */
export async function fetchStates(): Promise<State[]> {
  try {
    const options = await fetchFormOptions();
    return options.states;
  } catch (error) {
    console.error('Error in fetchStates:', error);
    throw error;
  }
}

/**
 * Fetch tags for a workspace
 */
export async function fetchTags(workspaceId: string): Promise<string[]> {
  try {
    const options = await fetchFormOptions(workspaceId);
    return options.tags;
  } catch (error) {
    console.error('Error in fetchTags:', error);
    throw error;
  }
}
