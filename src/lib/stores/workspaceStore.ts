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
          currentWorkspace: current
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
        const fetchedWorkspaces = userWorkspaces
          ?.filter(item => item.workspaces)
          .map(item => item.workspaces) || [];
        
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
        
        // Update store with fetched workspaces
        update(state => {
          const workspaces = fetchedWorkspaces;
          const currentWorkspace = workspaces.find(w => state.currentWorkspace && w.id === state.currentWorkspace.id) || workspaces[0] || null;
          
          return {
            ...state,
            workspaces,
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