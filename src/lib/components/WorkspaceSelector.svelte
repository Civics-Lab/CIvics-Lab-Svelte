<!-- src/lib/components/WorkspaceSelector.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import type { Workspace } from '$lib/types/supabase';
  import type { WorkspaceRole } from '$lib/types/supabase';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import WorkspaceLogo from './WorkspaceLogo.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  // Local state for popover
  const isOpen = writable(false);
  
  // Ensure the workspaces are loaded when the component mounts
  onMount(() => {
    if (!$workspaceStore.workspaces || $workspaceStore.workspaces.length === 0) {
      workspaceStore.refreshWorkspaces();
    }
  });
  
  // Function to check if the user has super admin role in any workspace
  function isSuperAdmin(): boolean {
    if (!$workspaceStore.workspaces || $workspaceStore.workspaces.length === 0) {
      return false;
    }
    
    return $workspaceStore.workspaces.some(workspace => 
      workspace.userRole === 'Super Admin'
    );
  }
  
  function togglePopover() {
    isOpen.update(value => !value);
  }
  
  // Define the extended workspace type that includes userRole
  type WorkspaceWithRole = Workspace & {
    userRole?: WorkspaceRole | null;
  };
  
  function selectWorkspace(workspace: WorkspaceWithRole) {
    console.log("User selected workspace:", workspace.name, workspace.id);
    // Explicitly store in localStorage first
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentWorkspaceId', workspace.id);
      console.log("Workspace ID saved to localStorage:", workspace.id);
    }
    workspaceStore.setCurrentWorkspace(workspace.id);
    isOpen.set(false);
  }
  
  // Close popover when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const popover = document.getElementById('workspace-popover');
    const button = document.getElementById('workspace-button');
    
    if (popover && button && !popover.contains(target) && !button.contains(target)) {
      isOpen.set(false);
    }
  }
  
  // Add event listener for clicking outside
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
    class="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50/80 transition-colors"
    on:click={togglePopover}
  >
    <div class="flex items-center space-x-2 flex-1 min-w-0">
      {#if $workspaceStore.isLoading}
        <LoadingSpinner size="sm" color="gray" />
        <span class="text-slate-600">Loading...</span>
      {:else if $workspaceStore.currentWorkspace}
        <WorkspaceLogo 
          logo={$workspaceStore.currentWorkspace.logo} 
          name={$workspaceStore.currentWorkspace.name} 
          size="sm" 
        />
        <span class="truncate text-slate-900 font-medium">
          {$workspaceStore.currentWorkspace.name}
        </span>
      {:else if $workspaceStore.error}
        <span class="text-slate-600">Error loading workspaces</span>
      {:else}
        <span class="text-slate-500">Select workspace...</span>
      {/if}
    </div>
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      class="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 {$isOpen ? 'rotate-180' : ''}" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  </button>
  
  {#if $isOpen}
    <div
      id="workspace-popover"
      class="absolute left-0 top-full z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
    >
      {#if $workspaceStore.isLoading}
        <div class="flex items-center px-2 py-1.5 text-sm text-slate-600">
          <LoadingSpinner size="sm" color="gray" />
          <span class="ml-2">Loading workspaces...</span>
        </div>
      {:else if $workspaceStore.error}
        <div class="px-2 py-1.5 text-sm text-red-600">{$workspaceStore.error}</div>
      {:else if $workspaceStore.workspaces.length === 0}
        <div class="px-2 py-1.5 text-sm text-slate-600">No workspaces found</div>
      {:else}
        {#each $workspaceStore.workspaces as workspace (workspace.id)}
          <button
            class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 {$workspaceStore.currentWorkspace?.id === workspace.id ? 'bg-slate-100 font-medium' : ''}"
            on:click={() => selectWorkspace(workspace)}
          >
            <div class="flex items-center gap-2 w-full">
              <WorkspaceLogo 
                logo={workspace.logo} 
                name={workspace.name} 
                size="sm" 
              />
              <span class="truncate text-slate-900">{workspace.name}</span>
              {#if $workspaceStore.currentWorkspace?.id === workspace.id}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="ml-auto h-4 w-4 text-slate-600" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              {/if}
            </div>
          </button>
        {/each}
      {/if}
      
      <!-- Create workspace button - only show for Super Admin role -->
      {#if isSuperAdmin()}
        <div class="border-t border-slate-200 mt-1 pt-1">
          <button
            class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 text-slate-700"
            on:click={() => {
              isOpen.set(false);
              // Dispatch an event that can be caught by a parent component
              const event = new CustomEvent('createWorkspace');
              window.dispatchEvent(event);
            }}
          >
            <div class="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-4 w-4 text-slate-500" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
              </svg>
              <span>Create New Workspace</span>
            </div>
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes zoom-in {
    from {
      transform: scale(0.95);
    }
    to {
      transform: scale(1);
    }
  }
  
  @keyframes slide-in-from-top {
    from {
      transform: translateY(-2px);
    }
    to {
      transform: translateY(0);
    }
  }
  
  .animate-in {
    animation: fade-in 150ms ease-out, zoom-in 150ms ease-out, slide-in-from-top 150ms ease-out;
  }
  
  .fade-in-0 {
    animation-duration: 150ms;
  }
  
  .zoom-in-95 {
    animation-duration: 150ms;
  }
  
  .slide-in-from-top-2 {
    animation-duration: 150ms;
  }
</style>