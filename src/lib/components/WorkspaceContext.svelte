<!-- src/lib/components/WorkspaceContext.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import { userStore } from '$lib/stores/userStore';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
    export let supabase: TypedSupabaseClient;
    
    // Function to fetch user data and update the store
    async function fetchUserData() {
      userStore.setLoading(true);
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        userStore.setUser(user);
      } catch (err) {
        console.error('Error fetching user:', err);
        userStore.setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        userStore.setLoading(false);
      }
    }
    
    // Function to fetch workspaces the user has access to
    async function fetchUserWorkspaces() {
      workspaceStore.setLoading(true);
      workspaceStore.setError(null);
      
      try {
        // Get the user's ID 
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          workspaceStore.setError('User not authenticated');
          return;
        }
        
        // Get all workspaces the user has access to through user_workspaces
        const { data, error: fetchError } = await supabase
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
        const fetchedWorkspaces = data
          .filter(item => item.workspaces) // Filter out any null workspace entries
          .map(item => item.workspaces);
        
        // Store workspaces in the store (this will set the first one as current by default)
        workspaceStore.setWorkspaces(fetchedWorkspaces);
        
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        workspaceStore.setError(err instanceof Error ? err.message : 'Failed to load workspaces');
      } finally {
        workspaceStore.setLoading(false);
      }
    }
    
    // Setup auth state change listener
    function setupAuthListener() {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
              userStore.setUser(session.user);
              fetchUserWorkspaces();
            }
          } else if (event === 'SIGNED_OUT') {
            userStore.setUser(null);
            workspaceStore.reset();
          }
        }
      );
      
      // Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    }
    
    onMount(() => {
      // Initial data fetch
      fetchUserData();
      fetchUserWorkspaces();
      
      // Setup auth state listener
      const cleanup = setupAuthListener();
      
      // Cleanup on component destroy
      return cleanup;
    });
  </script>
  
  <!-- This is a context component without UI, it just sets up context for child components -->
  <slot />