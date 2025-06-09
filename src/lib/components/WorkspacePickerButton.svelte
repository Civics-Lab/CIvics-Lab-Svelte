<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import type { Workspace } from '$lib/types/supabase';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import { clickOutside } from '$lib/actions/clickOutside';

  // Local state for popover
  const isOpen = writable(false);
  
  let buttonElement: HTMLButtonElement;
  let dropdownElement: HTMLDivElement;
  let mounted = false;
  
  // Ensure the workspaces are loaded when the component mounts
  onMount(() => {
    mounted = true;
    if (!$workspaceStore.workspaces || $workspaceStore.workspaces.length === 0) {
      workspaceStore.refreshWorkspaces();
    }
  });
  
  onDestroy(() => {
    mounted = false;
  });
  
  async function togglePopover() {
    isOpen.update(value => !value);
    if ($isOpen) {
      await tick();
      updateDropdownPosition();
    }
  }
  
  function updateDropdownPosition() {
    if (!buttonElement || !dropdownElement || !mounted) return;
    
    const buttonRect = buttonElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dropdownWidth = 240; // w-60 = 240px
    const dropdownHeight = Math.min(320, viewportHeight - buttonRect.bottom - 20); // max-h-80 with some margin
    
    let left = buttonRect.left;
    let top = buttonRect.bottom + 8;
    
    // Adjust horizontal position if dropdown would go off screen
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 16;
    }
    
    // Adjust vertical position if dropdown would go off screen
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - 8;
    }
    
    dropdownElement.style.position = 'fixed';
    dropdownElement.style.left = `${left}px`;
    dropdownElement.style.top = `${top}px`;
    dropdownElement.style.zIndex = '9999';
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
  
  // Function to check if the user is a Global Super Admin
  function isGlobalSuperAdmin(): boolean {
    return $workspaceStore.isGlobalSuperAdmin || false;
  }
  
  // Close popover when clicking outside
  function handleClickOutside() {
    isOpen.set(false);
  }
  
  // Update position on scroll or resize
  function handleWindowEvents() {
    if ($isOpen && mounted) {
      updateDropdownPosition();
    }
  }
  
  onMount(() => {
    const handleScroll = () => handleWindowEvents();
    const handleResize = () => handleWindowEvents();
    
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  });
  
  // Reactive statement to update position when dropdown opens
  $: if ($isOpen && dropdownElement && mounted) {
    updateDropdownPosition();
  }
</script>

<div class="relative" use:clickOutside={handleClickOutside}>
  <!-- Workspace Avatar Button -->
  <button
    bind:this={buttonElement}
    id="workspace-picker-button"
    class="h-10 w-10 flex items-center justify-center text-white font-semibold bg-slate-700 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
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
</div>

<!-- Dropdown rendered outside sidebar with fixed positioning -->
{#if $isOpen && mounted}
  <div
    bind:this={dropdownElement}
    id="workspace-popover"
    class="w-60 bg-white border border-gray-200 rounded-md shadow-lg"
    role="menu"
    style="position: fixed; z-index: 9999;"
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
            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center {$workspaceStore.currentWorkspace?.id === workspace.id ? 'bg-slate-100 text-slate-900 font-medium' : 'text-gray-700'}"
            on:click={() => selectWorkspace(workspace)}
            role="menuitem"
          >
            <div class="h-8 w-8 rounded-md flex items-center justify-center mr-3 bg-slate-200 text-slate-900 font-medium">
              {getWorkspaceInitial(workspace.name)}
            </div>
            <span class="truncate">{workspace.name}</span>
          </button>
        {/each}
      {/if}
    </div>
    
    <!-- Create workspace button - only show for Global Super Admins -->
    {#if isGlobalSuperAdmin()}
      <div class="border-t border-gray-200 bg-white sticky bottom-0">
        <button
          class="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center font-medium"
          on:click={openCreateWorkspaceModal}
          role="menuitem"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Workspace
        </button>
      </div>
    {/if}
  </div>
{/if}
