<!-- src/lib/components/contacts/ContactsViewNavbar.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import { clickOutside } from '$lib/actions/clickOutside';
  
    // Props
    export let views = [];
    export let currentView = null;
    export let viewsLoading = false;
    export let viewsError = null;
    export let isViewSelectOpen = false;
    export let isViewSettingsOpen = false;
    export let availableFields = [];
    
    const dispatch = createEventDispatcher();
    
    // Event handlers
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
    
    function selectView(view) {
      dispatch('selectView', view);
      isViewSelectOpen = false;
    }
    
    function toggleField(fieldId) {
      dispatch('toggleField', fieldId);
    }
    
    function openCreateViewModal() {
      dispatch('openCreateViewModal');
      isViewSelectOpen = false;
    }
    
    function openEditViewModal() {
      dispatch('openEditViewModal');
      isViewSettingsOpen = false;
    }
    
    function openDeleteViewModal() {
      dispatch('openDeleteViewModal');
      isViewSettingsOpen = false;
    }
    
    function openContactModal() {
      dispatch('openContactModal');
    }
    
    function closeViewSelect() {
      isViewSelectOpen = false;
    }
    
    function closeViewSettings() {
      isViewSettingsOpen = false;
    }
  </script>
  
  <div class="bg-slate-100 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
    <div class="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h1 class="text-xl font-semibold">Contacts</h1>
    </div>
    
    <div class="flex items-center space-x-4">
      <!-- View Selector -->
      <div class="relative">
        <button 
          class="px-3 py-2 border rounded-md bg-white flex items-center space-x-2 text-sm hover:bg-gray-50"
          on:click={toggleViewSelect}
        >
          <span>{currentView?.view_name || 'Select View'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {#if isViewSelectOpen}
          <div 
            class="absolute right-0 mt-1 w-64 bg-white border rounded-md shadow-lg z-10"
            use:clickOutside={closeViewSelect}
          >
            <div class="max-h-64 overflow-y-auto">
              {#if viewsLoading}
                <div class="p-3 text-center">
                  <LoadingSpinner size="sm" />
                </div>
              {:else if viewsError}
                <div class="p-3 text-red-500 text-sm">
                  {viewsError}
                </div>
              {:else if views.length === 0}
                <div class="p-3 text-gray-500 text-center text-sm">
                  No views available
                </div>
              {:else}
                {#each views as view (view.id)}
                  <button
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 {currentView?.id === view.id ? 'bg-blue-50 text-blue-700' : ''}"
                    on:click={() => selectView(view)}
                  >
                    {view.view_name}
                  </button>
                {/each}
              {/if}
            </div>
            <div class="border-t p-2">
              <button
                class="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                on:click={openCreateViewModal}
              >
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create New View
                </div>
              </button>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- View Settings -->
      <div class="relative">
        <button 
          class="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          on:click={toggleViewSettings}
          title="View Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        {#if isViewSettingsOpen}
          <div 
            class="absolute right-0 mt-1 w-72 bg-white border rounded-md shadow-lg z-10"
            use:clickOutside={closeViewSettings}
          >
            <div class="p-3 border-b">
              <h3 class="font-medium">View Settings</h3>
              <p class="text-sm text-gray-500">Configure visible columns</p>
            </div>
            
            <div class="max-h-80 overflow-y-auto p-3">
              {#each availableFields as field}
                <div class="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`field-${field.id}`}
                    class="rounded text-blue-600 focus:ring-blue-500"
                    checked={currentView ? currentView[field.id] : false}
                    on:change={() => toggleField(field.id)}
                  />
                  <label for={`field-${field.id}`} class="ml-2 text-sm">{field.label}</label>
                </div>
              {/each}
            </div>
            
            <div class="border-t p-3 flex justify-between">
              <button
                class="text-sm text-blue-600 hover:underline"
                on:click={openEditViewModal}
              >
                Edit View
              </button>
              
              <button
                class="text-sm text-red-600 hover:underline"
                on:click={openDeleteViewModal}
              >
                Delete View
              </button>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Add Contact Button -->
      <button 
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-500 hover:bg-teal-600"
        on:click={openContactModal}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Contact
      </button>
    </div>
  </div>
