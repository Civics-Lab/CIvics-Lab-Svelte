<!-- src/lib/components/CreateWorkspaceModal.svelte -->
<script lang="ts">
    import { writable } from 'svelte/store';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import { userStore } from '$lib/stores/userStore';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    import LoadingSpinner from './LoadingSpinner.svelte';
    
    export let supabase: TypedSupabaseClient;
    export let isOpen = false;
    export let onClose = () => {};
    
    const workspaceName = writable('');
    const isSubmitting = writable(false);
    const error = writable<string | null>(null);
    
    async function createWorkspace() {
      if (!$workspaceName.trim()) {
        error.set('Workspace name is required');
        return;
      }
      
      isSubmitting.set(true);
      error.set(null);
      
      try {
        // Get current user
        if (!$userStore.user) {
          throw new Error('User not authenticated');
        }
        
        // Start a Supabase transaction
        const { data: workspace, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: $workspaceName.trim(),
            created_by: $userStore.user.id
          })
          .select()
          .single();
        
        if (workspaceError) throw workspaceError;
        
        // Add user to workspace with Super Admin role
        const { error: userWorkspaceError } = await supabase
          .from('user_workspaces')
          .insert({
            user_id: $userStore.user.id,
            workspace_id: workspace.id,
            role: 'Super Admin'
          });
        
        if (userWorkspaceError) throw userWorkspaceError;
        
        // Fetch updated workspaces
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
          .eq('user_id', $userStore.user.id);
        
        if (fetchError) throw fetchError;
        
        // Transform the data to get the workspaces array
        const fetchedWorkspaces = userWorkspaces
          .filter(item => item.workspaces)
          .map(item => item.workspaces);
        
        // Update workspace store
        workspaceStore.setWorkspaces(fetchedWorkspaces, workspace.id);
        
        // Reset and close modal
        workspaceName.set('');
        onClose();
        
      } catch (err) {
        console.error('Error creating workspace:', err);
        error.set(err instanceof Error ? err.message : 'Failed to create workspace');
      } finally {
        isSubmitting.set(false);
      }
    }
    
    function handleClose() {
      workspaceName.set('');
      error.set(null);
      onClose();
    }
    
    // Close modal when Escape key is pressed
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    }
  </script>
  
  <svelte:window on:keydown={handleKeydown} />
  
  {#if isOpen}
    <div class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        class="bg-white rounded-lg shadow-xl max-w-md w-full" 
        on:click|stopPropagation 
        on:keydown|stopPropagation
        role="dialog"
        tabindex="-1"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        <div class="p-6">
          <h2 id="modal-title" class="text-xl font-semibold mb-4">Create New Workspace</h2>
          
          <form on:submit|preventDefault={createWorkspace}>
            <div class="mb-4">
              <label for="workspace-name" class="block text-sm font-medium text-gray-700 mb-1">
                Workspace Name
              </label>
              <input
                id="workspace-name"
                type="text"
                bind:value={$workspaceName}
                class="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter workspace name"
                disabled={$isSubmitting}
              />
              {#if $error}
                <p class="mt-1 text-sm text-red-600">{$error}</p>
              {/if}
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                on:click={handleClose}
                disabled={$isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={$isSubmitting}
              >
                {#if $isSubmitting}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Creating...</span>
                  </div>
                {:else}
                  Create Workspace
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  {/if}