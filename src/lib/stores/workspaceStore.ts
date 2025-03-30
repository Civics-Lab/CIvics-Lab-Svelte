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
      console.log("setWorkspaces called with:", { 
        workspaces: workspaces.map(w => ({ id: w.id, name: w.name })),
        currentId 
      });
      
      update(state => {
        console.log("Current state in store:", { 
          currentWorkspace: state.currentWorkspace ? 
            { id: state.currentWorkspace.id, name: state.currentWorkspace.name } : null 
        });
        
        // Determine which workspace to set as current with this priority:
        // 1. Explicitly provided currentId parameter
        // 2. Already selected workspace in state (maintain selection)
        // 3. First workspace as fallback
        let current: Workspace | null = null;
        
        if (currentId) {
          console.log("Using explicitly provided ID:", currentId);
          // 1. Use explicitly provided ID
          current = workspaces.find(w => w.id === currentId) || null;
        } else if (state.currentWorkspace?.id) {
          console.log("Maintaining current selection:", state.currentWorkspace.id);
          // 2. Maintain current selection if it exists in the new workspace list
          current = workspaces.find(w => w.id === state.currentWorkspace?.id) || null;
        }
        
        // 3. Fall back to first workspace only if no current selection exists
        if (!current && workspaces.length > 0) {
          console.log("Falling back to first workspace:", workspaces[0].id);
          current = workspaces[0];
        }
        
        console.log("Selected workspace:", current ? { id: current.id, name: current.name } : null);
          
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
      console.log("setCurrentWorkspace called with ID:", workspaceId);
      
      update(state => {
        let workspace = workspaceData;
        
        if (!workspace) {
          workspace = state.workspaces.find(w => w.id === workspaceId) || null;
        }
        
        // Store the workspace ID in localStorage for persistence
        if (typeof window !== 'undefined' && workspace) {
          console.log("Saving workspace ID to localStorage:", workspace.id);
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
      console.log("Resetting workspace store and removing from localStorage");
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
        
        console.log("refreshWorkspaces - savedWorkspaceId from localStorage:", savedWorkspaceId);
        
        // Update store with fetched workspaces
        update(state => {
          console.log("refreshWorkspaces - current state:", { 
            currentWorkspace: state.currentWorkspace ? 
              { id: state.currentWorkspace.id, name: state.currentWorkspace.name } : null 
          });
          
          // On page refresh, always prioritize the value from localStorage
          // if it exists and is valid
          let currentWorkspace = null;
          
          if (savedWorkspaceId) {
            // Try to find the workspace with the saved ID
            currentWorkspace = fetchedWorkspaces.find(w => w.id === savedWorkspaceId);
            console.log("Using workspace from localStorage:", 
              currentWorkspace ? { id: currentWorkspace.id, name: currentWorkspace.name } : "Not found");
          }
          
          // If no valid workspace was found from localStorage, use the current one if it exists
          if (!currentWorkspace && state.currentWorkspace) {
            currentWorkspace = fetchedWorkspaces.find(w => w.id === state.currentWorkspace?.id);
            console.log("Using current workspace from state:", 
              currentWorkspace ? { id: currentWorkspace.id, name: currentWorkspace.name } : "Not found");
          }
          
          // Fallback to the first workspace if no other selection is valid
          if (!currentWorkspace && fetchedWorkspaces.length > 0) {
            currentWorkspace = fetchedWorkspaces[0];
            console.log("Falling back to first workspace:", { id: currentWorkspace.id, name: currentWorkspace.name });
          }
          
          // Ensure currentWorkspace is not undefined when returning
          currentWorkspace = currentWorkspace || null;
          
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