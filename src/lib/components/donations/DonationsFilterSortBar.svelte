<!-- src/lib/components/donations/DonationsFilterSortBar.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  
  export let isFilterPopoverOpen: boolean = false;
  export let isSortPopoverOpen: boolean = false;
  export let filters: any[] = [];
  export let sorting: any[] = [];
  export let searchQuery: string = '';
  export let availableFields: any[] = []; 
  export let currentView: any = null;
  export let donationStats = {
    totalAmount: 0,
    averageAmount: 0,
    donorCount: 0
  };
  
  const dispatch = createEventDispatcher();
  
  function handleAddFilter() {
    dispatch('addFilter');
    // Keep popover open
  }
  
  function handleRemoveFilter(index: number) {
    dispatch('removeFilter', index);
  }
  
  function handleMoveFilter(index: number, direction: 'up' | 'down') {
    dispatch('moveFilter', { index, direction });
  }
  
  function handleAddSort() {
    dispatch('addSort');
    // Keep popover open
  }
  
  function handleRemoveSort(index: number) {
    dispatch('removeSort', index);
  }
  
  function handleMoveSort(index: number, direction: 'up' | 'down') {
    dispatch('moveSort', { index, direction });
  }
  
  function handleFilterFieldChange(index: number, field: string) {
    filters[index].field = field;
    dispatch('filterChanged');
  }
  
  function handleFilterOperatorChange(index: number, operator: string) {
    filters[index].operator = operator;
    dispatch('filterChanged');
  }
  
  function handleFilterValueChange(index: number, value: string) {
    filters[index].value = value;
    dispatch('filterChanged');
  }
  
  function handleSortFieldChange(index: number, field: string) {
    sorting[index].field = field;
    dispatch('sortChanged');
  }
  
  function handleSortDirectionChange(index: number, direction: 'asc' | 'desc') {
    sorting[index].direction = direction;
    dispatch('sortChanged');
  }
  
  function handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    dispatch('searchChanged', value);
  }
  
  // Get field label from field ID
  function getFieldLabel(fieldId: string): string {
    const field = availableFields.find(f => f.id === fieldId);
    return field ? field.label : fieldId;
  }
  
  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  // Filter operators
  const operators = [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: '>=', label: 'Greater Than or Equal' },
    { value: '<=', label: 'Less Than or Equal' }
  ];
</script>

<!-- Stats row with donation metrics -->
<div class="grid grid-cols-3 gap-4 px-6 py-4 bg-white">
  <div class="p-3 bg-gray-50 rounded-lg">
    <h3 class="text-sm font-medium text-gray-500">Total Donations</h3>
    <p class="text-2xl font-bold text-gray-900" id="totalDonations">{formatCurrency(donationStats.totalAmount)}</p>
  </div>
  
  <div class="p-3 bg-gray-50 rounded-lg">
    <h3 class="text-sm font-medium text-gray-500">Average Donation</h3>
    <p class="text-2xl font-bold text-gray-900" id="avgDonation">{formatCurrency(donationStats.averageAmount)}</p>
  </div>
  
  <div class="p-3 bg-gray-50 rounded-lg">
    <h3 class="text-sm font-medium text-gray-500">Number of Donors</h3>
    <p class="text-2xl font-bold text-gray-900" id="donorCount">{donationStats.donorCount}</p>
  </div>
</div>

<!-- Filter, sort, and search bar -->
<div class="bg-white px-6 py-3 flex items-center justify-between">
  <!-- Search -->
  <div class="flex-1 max-w-lg">
    <div class="relative rounded-md shadow-sm">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search donations..."
        class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
        value={searchQuery}
        on:input={handleSearch}
      />
    </div>
  </div>
  
  <!-- Filter and Sort buttons on the right side -->
  <div class="flex space-x-3">
    <!-- Filter button -->
    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        class:bg-blue-50={filters.length > 0}
        class:text-blue-700={filters.length > 0}
        class:border-blue-300={filters.length > 0}
        on:click={() => isFilterPopoverOpen = !isFilterPopoverOpen}
      >
        <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
        </svg>
        <span>Filters{filters.length > 0 ? ` (${filters.length})` : ''}</span>
      </button>
      
      {#if isFilterPopoverOpen}
        <div 
          class="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
          use:clickOutside={() => isFilterPopoverOpen = false}
        >
          <div class="p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-medium text-gray-900">Filter Donations</h3>
              <button
                type="button"
                class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                on:click={handleAddFilter}
              >
                Add Filter
              </button>
            </div>
            
            {#if filters.length === 0}
              <div class="text-center py-4">
                <p class="text-sm text-gray-500">No filters applied</p>
                <button
                  type="button"
                  class="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  on:click={handleAddFilter}
                >
                  Add your first filter
                </button>
              </div>
            {:else}
              <div class="space-y-4">
                {#each filters as filter, index (index)}
                  <div class="bg-gray-50 p-3 rounded-md relative">
                    <!-- Up/Down/Remove buttons -->
                    <div class="absolute right-2 top-2 flex space-x-1">
                      {#if index > 0}
                        <button
                          type="button"
                          class="text-gray-400 hover:text-gray-500"
                          on:click={() => handleMoveFilter(index, 'up')}
                          title="Move up"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      {/if}
                      {#if index < filters.length - 1}
                        <button
                          type="button"
                          class="text-gray-400 hover:text-gray-500"
                          on:click={() => handleMoveFilter(index, 'down')}
                          title="Move down"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      {/if}
                      <button
                        type="button"
                        class="text-gray-400 hover:text-red-500"
                        on:click={() => handleRemoveFilter(index)}
                        title="Remove filter"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <!-- Filter controls -->
                    <div class="grid grid-cols-3 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Field</label>
                        <select
                          class="block w-full pl-3 pr-10 py-2 text-xs border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          value={filter.field}
                          on:change={(e) => handleFilterFieldChange(index, e.target.value)}
                        >
                          {#each availableFields.filter(field => !currentView || currentView[field.id]) as field (field.id)}
                            <option value={field.id}>{field.label}</option>
                          {/each}
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                        <select
                          class="block w-full pl-3 pr-10 py-2 text-xs border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          value={filter.operator}
                          on:change={(e) => handleFilterOperatorChange(index, e.target.value)}
                        >
                          {#each operators as op (op.value)}
                            <option value={op.value}>{op.label}</option>
                          {/each}
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Value</label>
                        <input
                          type="text"
                          class="block w-full pl-3 pr-3 py-2 text-xs border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          value={filter.value}
                          on:input={(e) => handleFilterValueChange(index, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Sort button -->
    <div class="relative">
      <button
        type="button"
        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        class:bg-blue-50={sorting.length > 0}
        class:text-blue-700={sorting.length > 0}
        class:border-blue-300={sorting.length > 0}
        on:click={() => isSortPopoverOpen = !isSortPopoverOpen}
      >
        <svg class="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
        </svg>
        <span>Sort{sorting.length > 0 ? ` (${sorting.length})` : ''}</span>
      </button>
      
      {#if isSortPopoverOpen}
        <div 
          class="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
          use:clickOutside={() => isSortPopoverOpen = false}
        >
          <div class="p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-medium text-gray-900">Sort Donations</h3>
              <button
                type="button"
                class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                on:click={handleAddSort}
              >
                Add Sort
              </button>
            </div>
            
            {#if sorting.length === 0}
              <div class="text-center py-4">
                <p class="text-sm text-gray-500">No sorting applied</p>
                <button
                  type="button"
                  class="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  on:click={handleAddSort}
                >
                  Add your first sort
                </button>
              </div>
            {:else}
              <div class="space-y-4">
                {#each sorting as sort, index (index)}
                  <div class="bg-gray-50 p-3 rounded-md relative">
                    <!-- Up/Down/Remove buttons -->
                    <div class="absolute right-2 top-2 flex space-x-1">
                      {#if index > 0}
                        <button
                          type="button"
                          class="text-gray-400 hover:text-gray-500"
                          on:click={() => handleMoveSort(index, 'up')}
                          title="Move up"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      {/if}
                      {#if index < sorting.length - 1}
                        <button
                          type="button"
                          class="text-gray-400 hover:text-gray-500"
                          on:click={() => handleMoveSort(index, 'down')}
                          title="Move down"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      {/if}
                      <button
                        type="button"
                        class="text-gray-400 hover:text-red-500"
                        on:click={() => handleRemoveSort(index)}
                        title="Remove sort"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <!-- Sort controls -->
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Field</label>
                        <select
                          class="block w-full pl-3 pr-10 py-2 text-xs border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          value={sort.field}
                          on:change={(e) => handleSortFieldChange(index, e.target.value)}
                        >
                          {#each availableFields.filter(field => !currentView || currentView[field.id]) as field (field.id)}
                            <option value={field.id}>{field.label}</option>
                          {/each}
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Direction</label>
                        <select
                          class="block w-full pl-3 pr-10 py-2 text-xs border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 rounded-md"
                          value={sort.direction}
                          on:change={(e) => handleSortDirectionChange(index, e.target.value)}
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
