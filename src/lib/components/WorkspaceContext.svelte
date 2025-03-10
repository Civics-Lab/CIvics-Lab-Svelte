<!-- src/lib/components/WorkspaceContext.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { userStore } from '$lib/stores/userStore';
  import { toastStore } from '$lib/stores/toastStore';
  import type { TypedSupabaseClient } from '$lib/types/supabase';
  import CreateWorkspaceModal from './CreateWorkspaceModal.svelte';
  import { writable } from 'svelte/store';
  
  export let supabase: TypedSupabaseClient;
  
  // State for create workspace modal
  const isCreateModalOpen = writable(false);
  
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
  
  // Function to fetch workspaces the user has access to - using two-step approach
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
      
      console.log("Current authenticated user:", user.id);
      
      // Step 1: Get the workspace IDs this user belongs to
      const { data: userWorkspaceRelations, error: relationsError } = await supabase
        .from('user_workspaces')
        .select('workspace_id, role')
        .eq('user_id', user.id);
      
      if (relationsError) throw relationsError;
      console.log("User workspace relations:", userWorkspaceRelations);
      
      if (!userWorkspaceRelations || userWorkspaceRelations.length === 0) {
        console.log("No workspace relations found for user");
        workspaceStore.setWorkspaces([]);
        return;
      }
      
      // Step 2: Fetch the actual workspaces
      const workspaceIds = userWorkspaceRelations.map(rel => rel.workspace_id);
      
      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds);
      
      if (workspacesError) throw workspacesError;
      console.log("Fetched workspaces:", workspaces);
      
      // If we have workspaces data
      if (workspaces && workspaces.length > 0) {
        // Enrich workspaces with roles from user_workspaces
        const enrichedWorkspaces = workspaces.map(workspace => {
          const relation = userWorkspaceRelations.find(rel => rel.workspace_id === workspace.id);
          return {
            ...workspace,
            userRole: relation ? relation.role : null
          };
        });
        
        console.log("Enriched workspaces:", enrichedWorkspaces);
        
        // Update the store with these workspaces
        workspaceStore.setWorkspaces(enrichedWorkspaces);
      } else {
        console.log("No workspaces found with the IDs:", workspaceIds);
        workspaceStore.setWorkspaces([]);
      }
      
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
  
  function openCreateWorkspaceModal() {
    isCreateModalOpen.set(true);
  }
  
  function closeCreateWorkspaceModal() {
    isCreateModalOpen.set(false);
  }
  
  // Handle successful workspace creation
  function handleWorkspaceCreated() {
    fetchUserWorkspaces();
    toastStore.success('Workspace created successfully');
  }
  
  let windowEventListener: any;
  
  onMount(() => {
    // Initial data fetch
    fetchUserData();
    fetchUserWorkspaces();
    
    // Setup auth state listener
    const cleanup = setupAuthListener();
    
    // Add event listener for workspace creation button
    windowEventListener = () => openCreateWorkspaceModal();
    window.addEventListener('createWorkspace', windowEventListener);
    
    // Cleanup on component destroy
    return () => {
      cleanup();
      window.removeEventListener('createWorkspace', windowEventListener);
    };
  });
  
  onDestroy(() => {
    if (windowEventListener) {
      window.removeEventListener('createWorkspace', windowEventListener);
    }
  });
</script>

<!-- This is a context component without UI, it just sets up context for child components -->
<slot />

<CreateWorkspaceModal 
  isOpen={$isCreateModalOpen} 
  {supabase}
  onClose={closeCreateWorkspaceModal}
  on:success={handleWorkspaceCreated}
/>