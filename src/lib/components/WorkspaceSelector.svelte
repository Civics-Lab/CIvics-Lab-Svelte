<!-- src/lib/components/WorkspaceSelector.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import type { Workspace } from '$lib/types/supabase';
  import LoadingSpinner from './LoadingSpinner.svelte';
  
  // Local state for popover
  const isOpen = writable(false);
  
  function togglePopover() {
    isOpen.update(value => !value);
  }
  
  function selectWorkspace(workspace: Workspace) {
    workspaceStore.setCurrentWorkspace(workspace.id);
    isOpen.set(false);
  }
  
  // Close popover when clicking outside (add in onMount in parent component or here with afterUpdate)
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const popover = document.getElementById('workspace-popover');
    const button = document.getElementById('workspace-button');
    
    if (popover && button && !popover.contains(target) && !button.contains(target)) {
      isOpen.set(false);
    }
  }
  
  // Add event listener for clicking outside
  import { onMount } from 'svelte';
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="relative">
  <button
    id="workspace-button"
    class="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    on:click={togglePopover}
  >
    <span class="flex-1 text-left truncate max-w-[200px] flex items-center">
      {#if $workspaceStore.isLoading}
        <LoadingSpinner size="sm" color="gray" />
        <span class="ml-2">Loading...</span>
      {:else if $workspaceStore.currentWorkspace}
        {$workspaceStore.currentWorkspace.name}
      {:else}
        Select Workspace
      {/if}
    </span>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>
  
  {#if $isOpen}
    <div
      id="workspace-popover"
      class="absolute left-0 mt-2 w-60 bg-white border rounded-md shadow-lg z-10"
    >
      <div class="py-1">
        {#if $workspaceStore.isLoading}
          <div class="px-4 py-2 text-sm text-gray-500 flex items-center">
            <LoadingSpinner size="sm" color="gray" />
            <span class="ml-2">Loading workspaces...</span>
          </div>
        {:else if $workspaceStore.error}
          <div class="px-4 py-2 text-sm text-red-500">{$workspaceStore.error}</div>
        {:else if $workspaceStore.workspaces.length === 0}
          <div class="px-4 py-2 text-sm text-gray-500">No workspaces found</div>
        {:else}
          {#each $workspaceStore.workspaces as workspace (workspace.id)}
            <button
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 {$workspaceStore.currentWorkspace?.id === workspace.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}"
              on:click={() => selectWorkspace(workspace)}
            >
              {workspace.name}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>