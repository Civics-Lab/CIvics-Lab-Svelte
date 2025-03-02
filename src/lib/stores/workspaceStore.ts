// src/lib/stores/workspaceStore.ts
import { writable } from 'svelte/store';
import type { Workspace } from '$lib/types/supabase';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
}

// Initialize the workspace store with default values
const initialState: WorkspaceState = {
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  error: null
};

function createWorkspaceStore() {
  const { subscribe, set, update } = writable<WorkspaceState>(initialState);

  return {
    subscribe,
    
    // Set the list of workspaces and optionally set a current workspace
    setWorkspaces: (workspaces: Workspace[], currentId?: string) => {
      update(state => {
        // Find the workspace with the matching ID or default to the first one
        const current = currentId 
          ? workspaces.find(w => w.id === currentId) 
          : workspaces.length > 0 ? workspaces[0] : null;
          
        return {
          ...state,
          workspaces,
          currentWorkspace: current
        };
      });
    },
    
    // Set the current workspace by ID
    setCurrentWorkspace: (workspaceId: string) => {
      update(state => {
        const workspace = state.workspaces.find(w => w.id === workspaceId) || null;
        return {
          ...state,
          currentWorkspace: workspace
        };
      });
    },
    
    // Update loading state
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },
    
    // Update error state
    setError: (error: string | null) => {
      update(state => ({ ...state, error }));
    },
    
    // Reset the store to its initial state
    reset: () => {
      set(initialState);
    }
  };
}

export const workspaceStore = createWorkspaceStore();