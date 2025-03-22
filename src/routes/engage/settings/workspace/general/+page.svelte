<!-- src/routes/engage/settings/workspace/general/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    const workspaceName = writable('');
    const isRenaming = writable(false);
    const isDeleting = writable(false);
    const showDeleteConfirm = writable(false);
    const deleteConfirmText = writable('');
    
    // Update form when workspace changes
    $: if ($workspaceStore.currentWorkspace) {
      workspaceName.set($workspaceStore.currentWorkspace.name);
    }
    
    async function handleRename() {
      if (!$workspaceStore.currentWorkspace || !$workspaceName.trim()) return;
      
      isRenaming.set(true);
      
      try {
        const { error } = await data.supabase
          .from('workspaces')
          .update({ name: $workspaceName.trim() })
          .eq('id', $workspaceStore.currentWorkspace.id);
        
        if (error) throw error;
        
        // Update the local store with the new name
        const updatedWorkspace = { ...$workspaceStore.currentWorkspace, name: $workspaceName.trim() };
        workspaceStore.setCurrentWorkspace(updatedWorkspace.id, updatedWorkspace);
        
        toastStore.success('Workspace renamed successfully');
      } catch (err) {
        console.error('Error renaming workspace:', err);
        toastStore.error('Failed to rename workspace');
      } finally {
        isRenaming.set(false);
      }
    }
    
    function initiateDelete() {
      showDeleteConfirm.set(true);
    }
    
    function cancelDelete() {
      showDeleteConfirm.set(false);
      deleteConfirmText.set('');
    }
    
    async function confirmDelete() {
      if (!$workspaceStore.currentWorkspace) return;
      
      if ($deleteConfirmText !== $workspaceStore.currentWorkspace.name) {
        toastStore.error('Workspace name does not match');
        return;
      }
      
      isDeleting.set(true);
      
      try {
        // Delete the workspace
        const { error } = await data.supabase
          .from('workspaces')
          .delete()
          .eq('id', $workspaceStore.currentWorkspace.id);
        
        if (error) throw error;
        
        // Refresh workspaces - this will select a new workspace or create a default one
        await workspaceStore.refreshWorkspaces(data.supabase);
        
        toastStore.success('Workspace deleted successfully');
        showDeleteConfirm.set(false);
      } catch (err) {
        console.error('Error deleting workspace:', err);
        toastStore.error('Failed to delete workspace');
      } finally {
        isDeleting.set(false);
      }
    }
  </script>
  
  <svelte:head>
    <title>Workspace Settings | Engage</title>
  </svelte:head>
  
  <div class="p-6">
    <h2 class="text-xl font-bold mb-6">Workspace Settings</h2>
    
    <!-- Workspace Name Form -->
    <div class="mb-10 border-b pb-6">
      <h3 class="text-lg font-medium mb-4">Workspace Name</h3>
      <div class="max-w-md">
        <div class="mb-4">
          <label for="workspace-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="workspace-name"
            type="text"
            bind:value={$workspaceName}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            disabled={$isRenaming}
          />
        </div>
        <button
          type="button"
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          on:click={handleRename}
          disabled={$isRenaming || !$workspaceName || !$workspaceStore.currentWorkspace}
        >
          {#if $isRenaming}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="white" />
              <span class="ml-2">Saving...</span>
            </div>
          {:else}
            Rename Workspace
          {/if}
        </button>
      </div>
    </div>
    
    <!-- Danger Zone -->
    <div class="mb-6">
      <h3 class="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
      
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex justify-between items-center">
          <div>
            <h4 class="text-base font-medium text-red-800">Delete this workspace</h4>
            <p class="text-sm text-red-700 mt-1">
              Permanently delete this workspace and all of its data. This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            class="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            on:click={initiateDelete}
          >
            Delete Workspace
          </button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    {#if $showDeleteConfirm}
      <div class="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div 
          class="bg-white rounded-lg shadow-xl max-w-md w-full" 
          on:click|stopPropagation 
          on:keydown|stopPropagation
        >
          <div class="p-6">
            <h2 class="text-xl font-semibold text-red-600 mb-4">Delete Workspace?</h2>
            <p class="mb-4">
              This action cannot be undone. This will permanently delete the
              <strong>{$workspaceStore.currentWorkspace?.name}</strong> workspace and all of its data.
            </p>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Please type <strong>{$workspaceStore.currentWorkspace?.name}</strong> to confirm
              </label>
              <input
                type="text"
                bind:value={$deleteConfirmText}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="Type workspace name here"
              />
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                on:click={cancelDelete}
                disabled={$isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                on:click={confirmDelete}
                disabled={$isDeleting || $deleteConfirmText !== $workspaceStore.currentWorkspace?.name}
              >
                {#if $isDeleting}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Deleting...</span>
                  </div>
                {:else}
                  Delete Workspace
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>