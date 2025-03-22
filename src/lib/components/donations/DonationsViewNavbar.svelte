<!-- src/lib/components/donations/DonationsViewNavbar.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  
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

<div class="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
  <div>
    <h2 class="text-lg font-medium text-gray-900">Donations</h2>
  </div>
  
  <div class="flex items-center space-x-2">
    <!-- View selector -->
    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        on:click={toggleViewSelect}
      >
        <span>{currentView ? currentView.view_name : 'Select View'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="-mr-1 ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      
      {#if isViewSelectOpen}
        <div 
          class="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
          use:clickOutside={closeViewSelect}
        >
          <div class="py-1">
            {#if viewsLoading}
              <div class="px-4 py-2 text-sm text-gray-500">Loading...</div>
            {:else if viewsError}
              <div class="px-4 py-2 text-sm text-red-500">{viewsError}</div>
            {:else if views.length === 0}
              <div class="px-4 py-2 text-sm text-gray-500">No views available</div>
            {:else}
              {#each views as view (view.id)}
                <button
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 {currentView && currentView.id === view.id ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'}"
                  on:click={() => handleSelectView(view)}
                >
                  {view.view_name}
                </button>
              {/each}
            {/if}
            <div class="border-t border-gray-100 mt-1 pt-1">
              <button
                class="w-full text-left px-4 py-2 text-sm text-purple-600 hover:bg-gray-100"
                on:click={handleOpenCreateViewModal}
              >
                + Create New View
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- View settings -->
    {#if currentView}
      <div class="relative">
        <button
          type="button"
          class="inline-flex items-center px-2 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          on:click={toggleViewSettings}
          aria-label="View settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {#if isViewSettingsOpen}
          <div 
            class="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
            use:clickOutside={closeViewSettings}
          >
            <div class="py-1">
              <div class="px-4 py-2 border-b border-gray-100">
                <h3 class="text-sm font-medium text-gray-900">View Settings</h3>
                <p class="text-xs text-gray-500">Customize visible columns in the current view</p>
              </div>
              
              <div class="px-4 py-2">
                <h4 class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Columns
                </h4>
                {#each availableFields as field (field.id)}
                  <div class="flex items-center py-1">
                    <input
                      type="checkbox"
                      id={field.id}
                      checked={currentView && currentView[field.id] === true}
                      class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      on:change={() => handleToggleField(field.id)}
                    />
                    <label for={field.id} class="ml-2 block text-sm text-gray-900">
                      {field.label}
                    </label>
                  </div>
                {/each}
              </div>
              
              <div class="border-t border-gray-100 mt-1 pt-1 px-4 py-2 flex justify-between">
                <button
                  class="text-sm text-purple-600 hover:text-purple-900"
                  on:click={handleOpenEditViewModal}
                >
                  Rename View
                </button>
                <button
                  class="text-sm text-red-600 hover:text-red-900"
                  on:click={handleOpenDeleteViewModal}
                >
                  Delete View
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    
    <!-- Right side actions -->
    <button
      type="button"
      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      on:click={handleOpenDonationModal}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Record Donation
    </button>
  </div>
</div>
