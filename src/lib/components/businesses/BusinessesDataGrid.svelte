<!-- src/lib/components/businesses/BusinessesDataGrid.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import BusinessDetailsSheet from '$lib/components/businesses/BusinessDetailsSheet.svelte';
    import Pagination from '$lib/components/shared/pagination/Pagination.svelte';
    import type { TypedSupabaseClient } from '$lib/types/supabase';
    
    // Props
    export let businesses = [];
    export let isLoading = false;
    export let error = null;
    export let visibleColumns = [];
    export let availableFields = [];
    export let supabase: TypedSupabaseClient;
    
    // Pagination props
    export let currentPage = 1;
    export let totalPages = 1;
    export let totalRecords = 0;
    export let pageSize = 100;
    export let pageSizeOptions = [50, 100, 250, 500, 1000];
    
    // State
    let columnRefs = {};
    let startX = 0;
    let startWidth = 0;
    let currentColumn = null;
    
    // Business details sheet state
    const isBusinessDetailsOpen = writable(false);
    const selectedBusinessId = writable<string | null>(null);
    
    const dispatch = createEventDispatcher<{
      addBusiness: void;
      businessUpdated: void;
      pageChanged: { page: number };
      pageSizeChanged: { pageSize: number };
    }>();
    
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
    
    // Computed paginated businesses
    $: paginatedBusinesses = (() => {
      if (totalRecords === 0) return businesses;
      
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return businesses.slice(startIndex, endIndex);
    })();
    
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
    
    function handlePageChanged(event) {
      dispatch('pageChanged', { page: event.detail.page });
    }
  
    function handlePageSizeChanged(event) {
      dispatch('pageSizeChanged', { pageSize: event.detail.pageSize });
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
      
      // Handle both camelCase and snake_case properties
      if (address.streetAddress || address.street_address) {
        parts.push(address.streetAddress || address.street_address);
      }
      
      if (address.city) {
        parts.push(address.city);
      }
      
      if (address.stateAbbreviation || address.state_abbreviation) {
        parts.push(address.stateAbbreviation || address.state_abbreviation);
      }
      
      return parts.join(', ') || '—';
    }
    
    // Format phone for display
    function formatPhone(phones) {
      if (!phones || !Array.isArray(phones) || phones.length === 0) return '—';
      
      // Handle both camelCase and snake_case properties
      return (phones[0].phoneNumber || phones[0].phone_number) || '—';
    }
    
    // Format tags for display
    function formatTags(tags) {
      if (!tags || !Array.isArray(tags) || tags.length === 0) return '—';
      
      // Tags can be either strings or objects with a tag property
      return tags.map(t => typeof t === 'string' ? t : (t.tag || '')).join(', ') || '—';
    }
    
    // Format employees for display
    function formatEmployees(employees) {
      if (!employees || !Array.isArray(employees) || employees.length === 0) return '—';
      
      // Just show the count of employees
      return `${employees.length} employee${employees.length === 1 ? '' : 's'}`;
    }
    
    // Format social media for display
    function formatSocialMedia(socialMediaAccounts) {
      if (!socialMediaAccounts || !Array.isArray(socialMediaAccounts) || socialMediaAccounts.length === 0) return '—';
      
      // Just show the count of social media accounts
      return `${socialMediaAccounts.length} account${socialMediaAccounts.length === 1 ? '' : 's'}`;
    }
    
    // Get the value from business based on column id (handling camelCase and snake_case)
    function getBusinessValue(business, columnId) {
      const snakeCaseKey = columnId.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      if (columnId === 'businessName' || columnId === 'business_name') {
        return business.businessName || business.business_name || '—';
      } else if (columnId === 'addresses') {
        return formatAddress(business.addresses);
      } else if (columnId === 'phoneNumbers' || columnId === 'phone_numbers') {
        return formatPhone(business.phoneNumbers || business.phone_numbers);
      } else if (columnId === 'tags') {
        return formatTags(business.tags);
      } else if (columnId === 'employees') {
        return formatEmployees(business.employees);
      } else if (columnId === 'socialMediaAccounts' || columnId === 'social_media_accounts') {
        return formatSocialMedia(business.socialMediaAccounts || business.social_media_accounts);
      } else {
        // Try both camelCase and snake_case
        return business[columnId] || business[snakeCaseKey] || '—';
      }
    }
    
    onMount(() => {
      return () => {
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
      };
    });
  </script>
  
  <div class="flex-1 overflow-auto relative px-6">
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
              {#each paginatedBusinesses as business (business.id)}
                <tr 
                  class="hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                  on:click={() => viewBusiness(business)}
                  aria-label="Click to view business details"
                >
                  {#each visibleColumns as columnId}
                    <td class="px-4 py-4 whitespace-nowrap">
                      <div class="text-sm {columnId === 'businessName' || columnId === 'business_name' ? 'font-medium text-gray-900' : 'text-gray-500'}">
                        {getBusinessValue(business, columnId)}
                      </div>
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
    
    <!-- Pagination -->
    {#if totalRecords > 0}
      <Pagination
        {currentPage}
        {totalPages}
        {totalRecords}
        {pageSize}
        {pageSizeOptions}
        {isLoading}
        on:pageChanged={handlePageChanged}
        on:pageSizeChanged={handlePageSizeChanged}
      />
    {/if}
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
