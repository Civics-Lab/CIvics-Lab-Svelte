<!-- src/lib/components/contacts/ContactsFilterSortBar.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    interface Field {
        id: string;
        label: string;
    }
    
    interface Filter {
        field: string;
        operator: string;
        value: string;
    }
    
    interface Sort {
        field: string;
        direction: 'asc' | 'desc';
    }
    
    interface FieldView {
        [key: string]: boolean;
    }
    
    // Props
    export let isFilterPopoverOpen = false;
    export let isSortPopoverOpen = false;
    export let filters: Filter[] = [];
    export let sorting: Sort[] = [];
    export let searchQuery = '';
    export let availableFields: Field[] = [];
    export let currentView: FieldView | null = null;
    export let hasFilterChanges = false;
    export let hasSortChanges = false;
    
    const dispatch = createEventDispatcher<{
        searchChanged: string;
        addFilter: void;
        removeFilter: number;
        moveFilter: { index: number; direction: 'up' | 'down' };
        filterChanged: void;
        addSort: void;
        removeSort: number;
        moveSort: { index: number; direction: 'up' | 'down' };
        sortChanged: void;
        saveChanges: void;
        cancelChanges: void;
    }>();
    
    // Get field label from id
    function getFieldLabel(fieldId: string): string {
        const field = availableFields.find(f => f.id === fieldId);
        return field ? field.label : fieldId;
    }
    
    // Toggle filter popover
    function toggleFilterPopover(): void {
        isFilterPopoverOpen = !isFilterPopoverOpen;
        if (isFilterPopoverOpen) isSortPopoverOpen = false;
    }
    
    // Toggle sort popover
    function toggleSortPopover(): void {
        isSortPopoverOpen = !isSortPopoverOpen;
        if (isSortPopoverOpen) isFilterPopoverOpen = false;
    }
    
    // Handle search input change
    function handleSearchInput(e: Event): void {
        const target = e.target as HTMLInputElement;
        dispatch('searchChanged', target.value);
    }
    
    // Add a new filter
    function addFilter(): void {
        dispatch('addFilter');
    }
    
    // Remove a filter
    function removeFilter(index: number): void {
        dispatch('removeFilter', index);
    }
    
    // Move a filter up or down
    function moveFilter(index: number, direction: 'up' | 'down'): void {
        dispatch('moveFilter', { index, direction });
    }
    
    // Update filter field
    function updateFilterField(index: number, fieldId: string): void {
        filters[index].field = fieldId;
        dispatch('filterChanged');
    }
    
    // Update filter operator
    function updateFilterOperator(index: number, operator: string): void {
        filters[index].operator = operator;
        dispatch('filterChanged');
    }
    
    // Update filter value
    function updateFilterValue(index: number, value: string): void {
        filters[index].value = value;
        dispatch('filterChanged');
    }
    
    // Add a new sort
    function addSort(): void {
        dispatch('addSort');
    }
    
    // Remove a sort
    function removeSort(index: number): void {
        dispatch('removeSort', index);
    }
    
    // Move a sort up or down
    function moveSort(index: number, direction: 'up' | 'down'): void {
        dispatch('moveSort', { index, direction });
    }
    
    // Update sort field
    function updateSortField(index: number, fieldId: string): void {
        sorting[index].field = fieldId;
        dispatch('sortChanged');
    }
    
    // Update sort direction
    function updateSortDirection(index: number, direction: 'asc' | 'desc'): void {
        sorting[index].direction = direction;
        dispatch('sortChanged');
    }
    
    // Get available operators
    function getAvailableOperators(): Array<{ id: string; label: string }> {
        return [
            { id: '=', label: 'Equals' },
            { id: '!=', label: 'Not equals' },
            { id: 'contains', label: 'Contains' },
            { id: 'startsWith', label: 'Starts with' },
            { id: 'endsWith', label: 'Ends with' },
            { id: '>', label: 'Greater than' },
            { id: '<', label: 'Less than' },
            { id: '>=', label: 'Greater than or equal' },
            { id: '<=', label: 'Less than or equal' }
        ];
    }
    
    // Get the visible fields that can be filtered/sorted
    function getFilterableFields(): Field[] {
        if (!currentView) return [];
        
        return availableFields.filter(field => 
            // Only include fields that are visible in the current view
            currentView[field.id] === true
        );
    }
    
    // Close popovers when clicking outside
    function handleClickOutside(event: MouseEvent): void {
        const filterPopover = document.getElementById('filter-popover');
        const filterButton = document.getElementById('filter-button');
        const sortPopover = document.getElementById('sort-popover');
        const sortButton = document.getElementById('sort-button');
        
        const target = event.target as HTMLElement;
        
        if (filterPopover && filterButton && 
            !filterPopover.contains(target) && 
            !filterButton.contains(target)) {
            isFilterPopoverOpen = false;
        }
        
        if (sortPopover && sortButton && 
            !sortPopover.contains(target) && 
            !sortButton.contains(target)) {
            isSortPopoverOpen = false;
        }
    }
    
    // Add click outside listener
    import { onMount, onDestroy } from 'svelte';
    
    onMount(() => {
        document.addEventListener('click', handleClickOutside);
    });
    
    onDestroy(() => {
        document.removeEventListener('click', handleClickOutside);
    });
</script>

<div class="bg-white px-6 py-3 flex items-center justify-between border-b border-gray-200">
  <div class="flex-1 max-w-lg">
    <div class="relative rounded-md shadow-sm">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search contacts..."
        class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
        value={searchQuery}
        on:input={handleSearchInput}
      />
    </div>
  </div>
  
  <div class="flex space-x-3">
    <!-- Filter Button -->
    <div class="relative">
      <button 
        id="filter-button"
        type="button"
        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        on:click={toggleFilterPopover}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filters
        {#if filters && filters.length > 0}
          <span class="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
            {filters.length}
          </span>
        {/if}
      </button>
      
      {#if isFilterPopoverOpen}
        <div 
          id="filter-popover"
          class="absolute z-10 right-0 mt-2 w-96 bg-white border rounded-md shadow-lg"
        >
          <div class="p-4 border-b">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">Filters</h3>
              <button
                type="button"
                class="text-sm text-blue-600 hover:text-blue-800"
                on:click={addFilter}
              >
                + Add Filter
              </button>
            </div>
            <p class="text-sm text-gray-500">
              Filter contacts based on field values
            </p>
          </div>
          
          <div class="max-h-80 overflow-y-auto p-4 space-y-4">
            {#if filters && filters.length > 0}
              {#each filters as filter, i}
                <div class="bg-gray-50 p-3 rounded-md relative">
                  <div class="absolute right-2 top-2 flex space-x-1">
                    {#if i > 0}
                      <button
                        type="button"
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveFilter(i, 'up')}
                        title="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    {/if}
                    
                    {#if i < filters.length - 1}
                      <button
                        type="button"
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveFilter(i, 'down')}
                        title="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    {/if}
                    
                    <button
                      type="button"
                      class="text-gray-400 hover:text-red-600"
                      on:click={() => removeFilter(i)}
                      title="Remove filter"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2 pr-8">
                    <div>
                      <label for={`filter-field-${i}`} class="block text-xs font-medium text-gray-500 mb-1">
                        Field
                      </label>
                      <select
                        id={`filter-field-${i}`}
                        class="block w-full px-2 py-1 text-sm border-gray-300 rounded-md"
                        value={filter.field}
                        on:change={(e) => {
                            const target = e.target as HTMLSelectElement;
                            updateFilterField(i, target.value);
                        }}
                      >
                        {#each getFilterableFields() as field}
                          <option value={field.id}>{field.label}</option>
                        {/each}
                      </select>
                    </div>
                    
                    <div>
                      <label for={`filter-operator-${i}`} class="block text-xs font-medium text-gray-500 mb-1">
                        Operator
                      </label>
                      <select
                        id={`filter-operator-${i}`}
                        class="block w-full px-2 py-1 text-sm border-gray-300 rounded-md"
                        value={filter.operator}
                        on:change={(e) => {
                            const target = e.target as HTMLSelectElement;
                            updateFilterOperator(i, target.value);
                        }}
                      >
                        {#each getAvailableOperators() as op}
                          <option value={op.id}>{op.label}</option>
                        {/each}
                      </select>
                    </div>
                    
                    <div>
                      <label for={`filter-value-${i}`} class="block text-xs font-medium text-gray-500 mb-1">
                        Value
                      </label>
                      <input
                        id={`filter-value-${i}`}
                        type="text"
                        class="block w-full px-2 py-1 text-sm border-gray-300 rounded-md"
                        value={filter.value}
                        on:input={(e) => {
                            const target = e.target as HTMLInputElement;
                            updateFilterValue(i, target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-center py-4 text-gray-500">
                No filters applied. Click "Add Filter" to create one.
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Sort Button -->
    <div class="relative">
      <button 
        id="sort-button"
        type="button"
        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        on:click={toggleSortPopover}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        Sort
        {#if sorting && sorting.length > 0}
          <span class="ml-1 bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
            {sorting.length}
          </span>
        {/if}
      </button>
      
      {#if isSortPopoverOpen}
        <div 
          id="sort-popover"
          class="absolute z-10 right-0 mt-2 w-80 bg-white border rounded-md shadow-lg"
        >
          <div class="p-4 border-b">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">Sort</h3>
              <button
                type="button"
                class="text-sm text-blue-600 hover:text-blue-800"
                on:click={addSort}
              >
                + Add Sort
              </button>
            </div>
            <p class="text-sm text-gray-500">
              Sort contacts by multiple fields
            </p>
          </div>
          
          <div class="max-h-80 overflow-y-auto p-4 space-y-4">
            {#if sorting && sorting.length > 0}
              {#each sorting as sort, i}
                <div class="bg-gray-50 p-3 rounded-md relative">
                  <div class="absolute right-2 top-2 flex space-x-1">
                    {#if i > 0}
                      <button
                        type="button"
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveSort(i, 'up')}
                        title="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    {/if}
                    
                    {#if i < sorting.length - 1}
                      <button
                        type="button"
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => moveSort(i, 'down')}
                        title="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    {/if}
                    
                    <button
                      type="button"
                      class="text-gray-400 hover:text-red-600"
                      on:click={() => removeSort(i)}
                      title="Remove sort"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-2 pr-8">
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">
                        Field
                      </label>
                      <select
                        class="block w-full px-2 py-1 text-sm border-gray-300 rounded-md"
                        value={sort.field}
                        on:change={(e) => {
                            const target = e.target as HTMLSelectElement;
                            updateSortField(i, target.value);
                        }}
                      >
                        {#each getFilterableFields() as field}
                          <option value={field.id}>{field.label}</option>
                        {/each}
                      </select>
                    </div>
                    
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">
                        Direction
                      </label>
                      <select
                        class="block w-full px-2 py-1 text-sm border-gray-300 rounded-md"
                        value={sort.direction}
                        on:change={(e) => {
                            const target = e.target as HTMLSelectElement;
                            updateSortDirection(i, target.value as 'asc' | 'desc');
                        }}
                      >
                        <option value="asc">Ascending (A→Z)</option>
                        <option value="desc">Descending (Z→A)</option>
                      </select>
                    </div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-center py-4 text-gray-500">
                No sorting applied. Click "Add Sort" to create one.
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Save/Cancel bar (only show when there are changes) -->
{#if hasFilterChanges || hasSortChanges}
  <div class="bg-blue-50 border-b border-blue-200 px-6 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <svg class="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm text-blue-800 font-medium">
          You have unsaved {hasFilterChanges && hasSortChanges ? 'filter and sort' : hasFilterChanges ? 'filter' : 'sort'} changes
        </span>
      </div>
      <div class="flex space-x-3">
        <button
          type="button"
          class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          on:click={() => dispatch('cancelChanges')}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          on:click={() => dispatch('saveChanges')}
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}