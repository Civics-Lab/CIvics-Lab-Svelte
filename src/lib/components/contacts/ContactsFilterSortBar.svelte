<!-- src/lib/components/contacts/ContactsFilterSortBar.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    // Props
    export let isFilterPopoverOpen = false;
    export let isSortPopoverOpen = false;
    export let filters = [];
    export let sorting = [];
    export let searchQuery = '';
    export let availableFields = [];
    export let currentView = null;
    
    const dispatch = createEventDispatcher();
    
    // Event handlers
    function toggleFilterPopover() {
      isFilterPopoverOpen = !isFilterPopoverOpen;
      if (isFilterPopoverOpen) {
        isSortPopoverOpen = false;
      }
    }
    
    function toggleSortPopover() {
      isSortPopoverOpen = !isSortPopoverOpen;
      if (isSortPopoverOpen) {
        isFilterPopoverOpen = false;
      }
    }
    
    function addFilter() {
      dispatch('addFilter');
    }
    
    function removeFilter(index) {
      dispatch('removeFilter', index);
    }
    
    function moveFilter(index, direction) {
      dispatch('moveFilter', { index, direction });
    }
    
    function addSort() {
      dispatch('addSort');
    }
    
    function removeSort(index) {
      dispatch('removeSort', index);
    }
    
    function moveSort(index, direction) {
      dispatch('moveSort', { index, direction });
    }
    
    function filterChanged(filter) {
      dispatch('filterChanged', filter);
    }
    
    function sortChanged(sort) {
      dispatch('sortChanged', sort);
    }
    
    function searchChanged() {
      dispatch('searchChanged', searchQuery);
    }
  </script>
  
  <div class="bg-white border-b px-6 py-3 flex flex-wrap items-center justify-between gap-2">
    <div class="flex items-center space-x-2">
      <!-- Filter Button -->
      <div class="relative">
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          on:click={toggleFilterPopover}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
          {#if filters.length > 0}
            <span class="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {filters.length}
            </span>
          {/if}
        </button>
        
        {#if isFilterPopoverOpen}
          <div class="absolute left-0 mt-1 w-80 bg-white border rounded-md shadow-lg z-10">
            <div class="p-3 border-b">
              <h3 class="font-medium">Filters</h3>
              <p class="text-sm text-gray-500">Add filters to narrow down results</p>
            </div>
            
            <div class="max-h-96 overflow-y-auto p-3 space-y-4">
              {#if filters.length === 0}
                <div class="text-center text-sm text-gray-500 py-2">
                  No filters applied
                </div>
              {:else}
                {#each filters as filter, i}
                  <div class="p-3 bg-gray-50 rounded-md relative">
                    <div class="absolute right-2 top-2 flex space-x-1">
                      <button 
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveFilter(i, 'up')}
                        disabled={i === 0}
                        class:opacity-30={i === 0}
                        title="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button 
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveFilter(i, 'down')}
                        disabled={i === filters.length - 1}
                        class:opacity-30={i === filters.length - 1}
                        title="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button 
                        class="text-red-400 hover:text-red-600"
                        on:click={() => removeFilter(i)}
                        title="Remove filter"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Field</label>
                        <select 
                          bind:value={filter.field}
                          class="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          on:change={() => filterChanged(filter)}
                        >
                          {#each availableFields.filter(field => currentView ? currentView[field.id] : true) as field}
                            <option value={field.id}>{field.label}</option>
                          {/each}
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                        <select 
                          bind:value={filter.operator}
                          class="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          on:change={() => filterChanged(filter)}
                        >
                          <option value="=">Equals</option>
                          <option value="!=">Not equals</option>
                          <option value="contains">Contains</option>
                          <option value="startsWith">Starts with</option>
                          <option value="endsWith">Ends with</option>
                          <option value=">">Greater than</option>
                          <option value="<">Less than</option>
                          <option value=">=">Greater than or equal</option>
                          <option value="<=">Less than or equal</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Value</label>
                        <input 
                          type="text" 
                          bind:value={filter.value}
                          class="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          on:change={() => filterChanged(filter)}
                        />
                      </div>
                    </div>
                  </div>
                {/each}
              {/if}
              
              <div class="mt-4">
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full justify-center"
                  on:click={addFilter}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Filter
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Sort Button -->
      <div class="relative">
        <button
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          on:click={toggleSortPopover}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          Sort
          {#if sorting.length > 0}
            <span class="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {sorting.length}
            </span>
          {/if}
        </button>
        
        {#if isSortPopoverOpen}
          <div class="absolute left-0 mt-1 w-80 bg-white border rounded-md shadow-lg z-10">
            <div class="p-3 border-b">
              <h3 class="font-medium">Sorting</h3>
              <p class="text-sm text-gray-500">Set the order of your contacts</p>
            </div>
            
            <div class="max-h-96 overflow-y-auto p-3 space-y-4">
              {#if sorting.length === 0}
                <div class="text-center text-sm text-gray-500 py-2">
                  No sorting applied
                </div>
              {:else}
                {#each sorting as sort, i}
                  <div class="p-3 bg-gray-50 rounded-md relative">
                    <div class="absolute right-2 top-2 flex space-x-1">
                      <button 
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveSort(i, 'up')}
                        disabled={i === 0}
                        class:opacity-30={i === 0}
                        title="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button 
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveSort(i, 'down')}
                        disabled={i === sorting.length - 1}
                        class:opacity-30={i === sorting.length - 1}
                        title="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button 
                        class="text-red-400 hover:text-red-600"
                        on:click={() => removeSort(i)}
                        title="Remove sort"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Field</label>
                        <select 
                          bind:value={sort.field}
                          class="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          on:change={() => sortChanged(sort)}
                        >
                          {#each availableFields.filter(field => currentView ? currentView[field.id] : true) as field}
                            <option value={field.id}>{field.label}</option>
                          {/each}
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Direction</label>
                        <select 
                          bind:value={sort.direction}
                          class="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          on:change={() => sortChanged(sort)}
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                {/each}
              {/if}
              
              <div class="mt-4">
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full justify-center"
                  on:click={addSort}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Sort
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Search Field -->
    <div class="relative flex-grow max-w-lg">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search contacts..."
        class="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        on:input={searchChanged}
      />
    </div>
  </div>