<!-- src/lib/components/contacts/ContactsViewNavbar.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import { clickOutside } from '$lib/actions/clickOutside';
    import SidebarToggle from '$lib/components/SidebarToggle.svelte';
    import { Users } from '@lucide/svelte';
  
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
  
  <div class="bg-white px-6 py-3 flex justify-between items-center">
    <div class="flex items-center">
      <!-- Sidebar Toggle Button -->
      <SidebarToggle />
      
      <!-- Divider -->
      <div class="w-px h-6 bg-slate-200 mx-3"></div>
      
      <!-- Icon and Heading -->
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <h1 class="text-xl font-semibold">Contacts</h1>
    </div>
    
    <div class="flex items-center space-x-4">
      <!-- View Selector -->
      <div class="relative">
        <button 
          class="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50/80 transition-colors min-w-[200px]"
          on:click={toggleViewSelect}
        >
          <span class="truncate text-slate-900 font-medium">
            {currentView?.viewName || 'Select View'}
          </span>
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
                  {viewsError}
                </div>
              {:else if views.length === 0}
                <div class="px-2 py-1.5 text-sm text-slate-600">No views available</div>
              {:else}
                {#each views as view (view.id)}
                  <button
                    class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 {currentView?.id === view.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-900'}"
                    on:click={() => selectView(view)}
                  >
                    <span class="truncate">{view.viewName}</span>
                    {#if currentView?.id === view.id}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        class="ml-auto h-4 w-4 text-blue-600" 
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
                class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 text-blue-600"
                on:click={openCreateViewModal}
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
      <div class="relative">
        <button 
          class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors"
          on:click={toggleViewSettings}
          title="View Settings"
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
              <p class="text-sm text-slate-500">Configure visible columns</p>
            </div>
            
            <div class="max-h-80 overflow-y-auto px-3 py-2">
              {#each availableFields as field}
                <div class="flex items-center space-x-2 py-1.5">
                  <input
                    type="checkbox"
                    id={`field-${field.id}`}
                    class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    checked={currentView ? currentView[field.id] : false}
                    on:change={() => toggleField(field.id)}
                  />
                  <label for={`field-${field.id}`} class="text-sm text-slate-900 font-medium">{field.label}</label>
                </div>
              {/each}
            </div>
            
            <div class="border-t border-slate-200 px-3 py-2 flex justify-between">
              <button
                class="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                on:click={openEditViewModal}
              >
                Edit View
              </button>
              
              <button
                class="text-sm text-red-600 hover:text-red-800 transition-colors"
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
        class="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white ring-offset-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        on:click={openContactModal}
      >
        <Users size={16} class="-ml-1 mr-2" />
        Add Contact
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