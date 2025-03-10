// src/lib/stores/workspaceStore.ts
import { writable } from 'svelte/store';
import type { Workspace } from '$lib/types/supabase';
import type { TypedSupabaseClient } from '$lib/types/supabase';

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
          currentWorkspace: current,
          isLoading: false // Make sure loading is set to false
        };
      });
    },
    
    // Set the current workspace by ID
    setCurrentWorkspace: (workspaceId: string, workspaceData?: Workspace) => {
      update(state => {
        let workspace = workspaceData;
        
        if (!workspace) {
          workspace = state.workspaces.find(w => w.id === workspaceId) || null;
        }
        
        // Store the workspace ID in localStorage for persistence
        if (typeof window !== 'undefined' && workspace) {
          localStorage.setItem('currentWorkspaceId', workspace.id);
        }
        
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentWorkspaceId');
      }
      set(initialState);
    },
    
    // Refresh workspaces from the database
    refreshWorkspaces: async (supabase: TypedSupabaseClient) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get all workspaces the user has access to
        const { data: userWorkspaces, error: fetchError } = await supabase
          .from('user_workspaces')
          .select(`
            id,
            workspace_id,
            role,
            workspaces:workspace_id (
              id,
              name,
              created_at
            )
          `)
          .eq('user_id', user.id);
        
        if (fetchError) throw fetchError;
        
        // Transform the data to get the workspaces array
        const fetchedWorkspaces = (userWorkspaces || [])
          .filter(item => item.workspaces)
          .map(item => item.workspaces as Workspace);
        
        if (fetchedWorkspaces.length === 0) {
          // Create a default workspace if none exists
          const { data: newWorkspace, error: createError } = await supabase
            .from('workspaces')
            .insert({
              name: 'My Workspace',
              created_by: user.id
            })
            .select()
            .single();
          
          if (createError) throw createError;
          
          // Add user to workspace with Super Admin role
          const { error: userWorkspaceError } = await supabase
            .from('user_workspaces')
            .insert({
              user_id: user.id,
              workspace_id: newWorkspace.id,
              role: 'Super Admin'
            });
          
          if (userWorkspaceError) throw userWorkspaceError;
          
          // Return with the new workspace
          update(state => ({
            ...state,
            workspaces: [newWorkspace],
            currentWorkspace: newWorkspace,
            isLoading: false
          }));
          
          return;
        }
        
        // Get previously selected workspace ID from localStorage
        const savedWorkspaceId = typeof window !== 'undefined' 
          ? localStorage.getItem('currentWorkspaceId') 
          : null;
        
        // Update store with fetched workspaces
        update(state => {
          // Try to use: 1. saved ID from localStorage, 2. current ID in state, 3. first workspace
          const currentId = savedWorkspaceId || 
            (state.currentWorkspace ? state.currentWorkspace.id : null);
          
          const currentWorkspace = currentId
            ? fetchedWorkspaces.find(w => w.id === currentId)
            : fetchedWorkspaces[0] || null;
          
          return {
            ...state,
            workspaces: fetchedWorkspaces,
            currentWorkspace,
            isLoading: false
          };
        });
      } catch (error) {
        console.error('Error refreshing workspaces:', error);
        update(state => ({ 
          ...state, 
          error: error instanceof Error ? error.message : 'Failed to refresh workspaces',
          isLoading: false
        }));
      }
    }
  };
}

export const workspaceStore = createWorkspaceStore();