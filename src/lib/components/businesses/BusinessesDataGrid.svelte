<!-- src/lib/components/businesses/BusinessesDataGrid.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import BusinessDetailsSheet from '$lib/components/businesses/BusinessDetailsSheet.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
    // Props
    export let businesses = [];
    export let isLoading = false;
    export let error = null;
    export let visibleColumns = [];
    export let availableFields = [];
    export let supabase: TypedSupabaseClient;
    
    // State
    let columnRefs = {};
    let startX = 0;
    let startWidth = 0;
    let currentColumn = null;
    
    // Business details sheet state
    const isBusinessDetailsOpen = writable(false);
    const selectedBusinessId = writable<string | null>(null);
    
    const dispatch = createEventDispatcher();
    
    // Methods
    function startResize(e, columnId) {
      startX = e.clientX;
      currentColumn = columnId;
      const column = columnRefs[columnId];
      if (column) {
        startWidth = column.offsetWidth;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
      }
      e.preventDefault();
    }
    
    function resize(e) {
      if (!currentColumn) return;
      const column = columnRefs[currentColumn];
      if (column) {
        const width = startWidth + (e.clientX - startX);
        if (width >= 50) { // Minimum width of 50px
          column.style.width = `${width}px`;
          column.style.minWidth = `${width}px`;
        }
      }
    }
    
    function stopResize() {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      currentColumn = null;
    }
    
    function getFieldLabel(columnId) {
      const field = availableFields.find(f => f.id === columnId);
      return field ? field.label : columnId;
    }
    
    function viewBusiness(business, e) {
      // Prevent the event from bubbling up to the tr click handler
      if (e) e.stopPropagation();
      
      selectedBusinessId.set(business.id);
      isBusinessDetailsOpen.set(true);
    }
    
    function addBusiness() {
      dispatch('addBusiness');
    }
    
    function handleBusinessUpdated() {
      dispatch('businessUpdated');
    }
    
    function closeBusinessDetails() {
      isBusinessDetailsOpen.set(false);
      selectedBusinessId.set(null);
    }
    
    // Format address for display
    function formatAddress(addresses) {
      if (!addresses || !Array.isArray(addresses) || addresses.length === 0) return '—';
      
      const address = addresses[0];
      const parts = [];
      
      if (address.street_address) parts.push(address.street_address);
      if (address.city) parts.push(address.city);
      if (address.state_abbreviation) parts.push(address.state_abbreviation);
      
      return parts.join(', ') || '—';
    }
    
    // Format phone for display
    function formatPhone(phones) {
      if (!phones || !Array.isArray(phones) || phones.length === 0) return '—';
      return phones[0].phone_number || '—';
    }
    
    // Format tags for display
    function formatTags(tags) {
      if (!tags || !Array.isArray(tags) || tags.length === 0) return '—';
      return tags.map(t => t.tag).join(', ') || '—';
    }
    
    onMount(() => {
      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
      };
    });
  </script>
  
  <div class="flex-1 overflow-auto relative">
    <div class="bg-white rounded-lg shadow overflow-hidden">
      {#if isLoading}
        <div class="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      {:else if error}
        <div class="text-center text-red-500 py-20">
          {error}
        </div>
      {:else if businesses.length === 0}
        <div class="text-center py-20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p class="text-gray-500 text-lg">No businesses found</p>
          <p class="text-gray-400 mt-1">Add your first business or adjust your filters</p>
          <button
            on:click={addBusiness}
            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Add a Business
          </button>
        </div>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                {#each visibleColumns as columnId}
                  <th 
                    scope="col" 
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    bind:this={columnRefs[columnId]}
                  >
                    {getFieldLabel(columnId)}
                    <!-- Column resize handle -->
                    <div 
                      class="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center group"
                      on:mousedown={(e) => startResize(e, columnId)}
                    >
                      <div class="h-full w-px bg-gray-300 group-hover:bg-green-500 group-hover:w-0.5"></div>
                    </div>
                  </th>
                {/each}
                <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each businesses as business (business.id)}
                <tr 
                  class="hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                  on:click={() => viewBusiness(business)}
                  aria-label="Click to view business details"
                >
                  {#each visibleColumns as columnId}
                    <td class="px-4 py-4 whitespace-nowrap">
                      {#if columnId === 'business_name'}
                        <div class="text-sm font-medium text-gray-900">
                          {business.business_name || '—'}
                        </div>
                      {:else if columnId === 'addresses'}
                        <div class="text-sm text-gray-500">
                          {formatAddress(business.addresses)}
                        </div>
                      {:else if columnId === 'phone_numbers'}
                        <div class="text-sm text-gray-500">
                          {formatPhone(business.phone_numbers)}
                        </div>
                      {:else if columnId === 'tags'}
                        <div class="text-sm text-gray-500">
                          {formatTags(business.tags)}
                        </div>
                      {:else if columnId === 'social_media_accounts' || columnId === 'employees'}
                        <!-- These would need custom formatting based on your data structure -->
                        <div class="text-sm text-gray-500">
                          {business[columnId] && Array.isArray(business[columnId]) && business[columnId].length > 0 
                            ? `${business[columnId].length} items` 
                            : '—'}
                        </div>
                      {:else}
                        <div class="text-sm text-gray-500">
                          {business[columnId] || '—'}
                        </div>
                      {/if}
                    </td>
                  {/each}
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      class="text-green-600 hover:text-green-900"
                      on:click={(e) => viewBusiness(business, e)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Business Details Sheet -->
  {#if $isBusinessDetailsOpen}
    <BusinessDetailsSheet 
      isOpen={$isBusinessDetailsOpen}
      businessId={$selectedBusinessId}
      {supabase}
      on:close={closeBusinessDetails}
      on:updated={handleBusinessUpdated}
    />
  {/if}