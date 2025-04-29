<!-- src/lib/components/WorkspacePickerButton.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import type { Workspace } from '$lib/types/supabase';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import { clickOutside } from '$lib/actions/clickOutside';

  // Local state for popover
  const isOpen = writable(false);
  
  // Ensure the workspaces are loaded when the component mounts
  onMount(() => {
    if (!$workspaceStore.workspaces || $workspaceStore.workspaces.length === 0) {
      workspaceStore.refreshWorkspaces();
    }
  });
  
  function togglePopover() {
    isOpen.update(value => !value);
  }
  
  function selectWorkspace(workspace: Workspace) {
    console.log("User selected workspace:", workspace.name, workspace.id);
    // Explicitly store in localStorage first
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentWorkspaceId', workspace.id);
      console.log("Workspace ID saved to localStorage:", workspace.id);
    }
    workspaceStore.setCurrentWorkspace(workspace.id);
    isOpen.set(false);
  }
  
  function openCreateWorkspaceModal() {
    isOpen.set(false);
    const event = new CustomEvent('createWorkspace');
    window.dispatchEvent(event);
  }
  
  // Get the first letter of workspace name for the avatar
  function getWorkspaceInitial(name: string): string {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }
</script>

<div class="relative" use:clickOutside={() => isOpen.set(false)}>
  <!-- Workspace Avatar Button -->
  <button
    id="workspace-picker-button"
    class="h-10 w-10 flex items-center justify-center text-white font-semibold bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
    on:click={togglePopover}
    aria-expanded={$isOpen}
    aria-haspopup="true"
  >
    {#if $workspaceStore.isLoading}
      <LoadingSpinner size="sm" color="white" />
    {:else if $workspaceStore.currentWorkspace}
      {getWorkspaceInitial($workspaceStore.currentWorkspace.name)}
    {:else}
      ?
    {/if}
  </button>
  
  <!-- Workspace Popover -->
  {#if $isOpen}
  <div
  id="workspace-popover"
  class="absolute left-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50"
  role="menu"
  >
  <div class="py-1 max-h-80 overflow-y-auto">
  {#if $workspaceStore.isLoading}
  <div class="px-4 py-2 text-sm text-gray-500 flex items-center">
  <LoadingSpinner size="sm" color="gray" />
  <span class="ml-2">Loading workspaces...</span>
  </div>
  {:else if $workspaceStore.error}
  <div class="px-4 py-2 text-sm text-red-500">
      <p class="font-semibold">Error loading workspaces:</p>
    <p class="mt-1">{$workspaceStore.error}</p>
  {#if $workspaceStore.error.includes('not found in database')}
    <p class="mt-2 text-gray-700">Your account may need to be refreshed. Please try logging out and logging back in.</p>
      <button 
          class="mt-2 w-full text-left px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded"
        on:click={() => {
        // Import the auth store and call logout
      const { auth } = require('$lib/auth/client');
      auth.logout();
      window.location.href = '/login?reason=user_not_found';
      }}
  >
  Logout Now
  </button>
  {/if}
  </div>
  {:else if $workspaceStore.workspaces.length === 0}
    <div class="px-4 py-2 text-sm text-gray-500">
        <p>No workspaces found</p>
            <p class="mt-1">Click below to create your first workspace</p>
          </div>
        {:else}
          {#each $workspaceStore.workspaces as workspace (workspace.id)}
            <button
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center {$workspaceStore.currentWorkspace?.id === workspace.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-700'}"
              on:click={() => selectWorkspace(workspace)}
              role="menuitem"
            >
              <div class="h-8 w-8 rounded-md flex items-center justify-center mr-3 bg-teal-100 text-teal-700 font-medium">
                {getWorkspaceInitial(workspace.name)}
              </div>
              <span class="truncate">{workspace.name}</span>
            </button>
          {/each}
        {/if}
      </div>
      
      <!-- Create workspace button (sticky to bottom) -->
      <div class="border-t border-gray-200 bg-white sticky bottom-0">
        <button
          class="w-full text-left px-4 py-3 text-sm text-teal-600 hover:bg-teal-50 flex items-center font-medium"
          on:click={openCreateWorkspaceModal}
          role="menuitem"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Workspace
        </button>
      </div>
    </div>
  {/if}
</div>
