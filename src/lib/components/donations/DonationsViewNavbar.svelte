<!-- src/lib/components/donations/DonationsViewNavbar.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  import SidebarToggle from '$lib/components/SidebarToggle.svelte';
  import { DollarSign } from '@lucide/svelte';
  
  export let views: any[] = [];
  export let currentView: any = null;
  export let viewsLoading: boolean = false;
  export let viewsError: string | null = null;
  export let isViewSelectOpen: boolean = false;
  export let isViewSettingsOpen: boolean = false;
  export let availableFields: any[] = [];
  
  const dispatch = createEventDispatcher();
  
  function toggleViewSelect(event) {
    // Close when clicking the button while the dropdown is open
    if (isViewSelectOpen) {
      isViewSelectOpen = false;
      event.stopPropagation();
      return;
    }
    
    isViewSelectOpen = true;
    if (isViewSettingsOpen) {
      isViewSettingsOpen = false; // Close the other popover
    }
  }
  
  function toggleViewSettings(event) {
    // Close when clicking the button while the dropdown is open
    if (isViewSettingsOpen) {
      isViewSettingsOpen = false;
      event.stopPropagation();
      return;
    }
    
    isViewSettingsOpen = true;
    if (isViewSelectOpen) {
      isViewSelectOpen = false; // Close the other popover
    }
  }
  
  function handleSelectView(view: any) {
    dispatch('selectView', view);
    isViewSelectOpen = false;
  }
  
  function handleToggleField(fieldId: string) {
    dispatch('toggleField', fieldId);
  }
  
  function handleOpenCreateViewModal() {
    dispatch('openCreateViewModal');
    isViewSelectOpen = false;
  }
  
  function handleOpenEditViewModal() {
    dispatch('openEditViewModal');
    isViewSettingsOpen = false;
  }
  
  function handleOpenDeleteViewModal() {
    dispatch('openDeleteViewModal');
    isViewSettingsOpen = false;
  }

  function handleOpenDonationModal() {
    dispatch('openDonationModal');
  }
  
  function closeViewSelect() {
    isViewSelectOpen = false;
  }
  
  function closeViewSettings() {
    isViewSettingsOpen = false;
  }
</script>

<div class="bg-white px-6 py-3 flex justify-between items-center">
  <div class="flex items-center">
    <!-- Sidebar Toggle Button -->
    <SidebarToggle />
    
    <!-- Divider -->
    <div class="w-px h-6 bg-slate-200 mx-3"></div>
    
    <!-- Icon and Heading -->
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h1 class="text-xl font-semibold">Donations</h1>
  </div>
  
  <div class="flex items-center space-x-4">
    <!-- View Selector -->
    <div class="relative">
      <button
        class="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50/80 transition-colors min-w-[200px]"
        on:click={toggleViewSelect}
      >
        <div class="flex items-center space-x-2 flex-1 min-w-0">
          <span class="truncate text-slate-900 font-medium">
            {currentView ? currentView.viewName : 'Select View'}
          </span>
          {#if currentView?.temporary}
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              Local Only
            </span>
          {/if}
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 {isViewSelectOpen ? 'rotate-180' : ''}" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      
      {#if isViewSelectOpen}
        <div 
          class="absolute left-0 top-full z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          use:clickOutside={closeViewSelect}
        >
          <div class="max-h-64 overflow-y-auto">
            {#if viewsLoading}
              <div class="flex items-center px-2 py-1.5 text-sm text-slate-600">
                <LoadingSpinner size="sm" />
                <span class="ml-2">Loading views...</span>
              </div>
            {:else if viewsError}
              <div class="px-2 py-1.5 text-sm text-red-600">
                <p class="mb-2">{viewsError}</p>
                <button 
                  class="text-purple-600 hover:text-purple-800 text-xs font-medium transition-colors"
                  on:click={() => dispatch('retryFetchViews')}
                >
                  Retry Loading Views
                </button>
              </div>
            {:else if views.length === 0}
              <div class="px-2 py-1.5 text-sm text-slate-600">No views available</div>
            {:else}
              {#each views as view (view.id)}
                <button
                  class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 {currentView && currentView.id === view.id ? 'bg-purple-50 text-purple-700 font-medium' : 'text-slate-900'}"
                  on:click={() => handleSelectView(view)}
                >
                  <span class="truncate">{view.viewName}</span>
                  {#if currentView && currentView.id === view.id}
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      class="ml-auto h-4 w-4 text-purple-600" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  {/if}
                </button>
              {/each}
            {/if}
          </div>
          <div class="border-t border-slate-200 mt-1 pt-1">
            <button
              class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 text-purple-600"
              on:click={handleOpenCreateViewModal}
            >
              <div class="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-4 w-4" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 12h14"/>
                  <path d="M12 5v14"/>
                </svg>
                <span>Create New View</span>
              </div>
            </button>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- View Settings -->
    {#if currentView}
      <div class="relative">
        <button
          class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors"
          on:click={toggleViewSettings}
          aria-label="View settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {#if isViewSettingsOpen}
          <div 
            class="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            use:clickOutside={closeViewSettings}
          >
            <div class="px-3 py-2 border-b border-slate-200">
              <h3 class="font-medium text-slate-900">View Settings</h3>
              <p class="text-sm text-slate-500">Customize visible columns in the current view</p>
            </div>
            
            <div class="px-3 py-2">
              <h4 class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Columns
              </h4>
              <div class="max-h-60 overflow-y-auto">
                {#each availableFields as field (field.id)}
                  <div class="flex items-center space-x-2 py-1.5">
                    <input
                      type="checkbox"
                      id={field.id}
                      checked={currentView && currentView[field.id] === true}
                      class="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                      on:change={() => handleToggleField(field.id)}
                    />
                    <label for={field.id} class="text-sm text-slate-900 font-medium">
                      {field.label}
                    </label>
                  </div>
                {/each}
              </div>
            </div>
            
            <div class="border-t border-slate-200 px-3 py-2 flex justify-between">
              <button
                class="text-sm text-purple-600 hover:text-purple-800 transition-colors"
                on:click={handleOpenEditViewModal}
              >
                Rename View
              </button>
              <button
                class="text-sm text-red-600 hover:text-red-800 transition-colors"
                on:click={handleOpenDeleteViewModal}
              >
                Delete View
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Add Donation Button -->
    <button
      class="inline-flex h-10 items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white ring-offset-white transition-colors hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      on:click={handleOpenDonationModal}
    >
      <DollarSign size={16} class="-ml-1 mr-2" />
      Record Donation
    </button>
  </div>
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