<!-- src/routes/engage/businesses/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import BusinessFormModal from '$lib/components/BusinessFormModal.svelte';
  import BusinessDetailsSheet from '$lib/components/businesses/BusinessDetailsSheet.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // State for the business form and details modals
  const isBusinessModalOpen = writable(false);
  const isBusinessDetailsOpen = writable(false);
  const selectedBusinessId = writable<string | null>(null);
  
  // Businesses data
  const businesses = writable<any[]>([]);
  const filteredBusinesses = writable<any[]>([]);
  const isLoadingBusinesses = writable(true);
  const businessesError = writable<string | null>(null);
  
  // Search and filter state
  const searchQuery = writable('');
  
  // Function to fetch businesses
  async function fetchBusinesses() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isLoadingBusinesses.set(true);
    businessesError.set(null);
    
    try {
      // First get basic business data
      const { data: businessData, error: businessError } = await data.supabase
        .from('active_businesses')
        .select('*')
        .order('business_name');
      
      if (businessError) throw businessError;
      
      // For each business, get additional details like primary address and phone
      const enrichedBusinesses = await Promise.all((businessData || []).map(async (business) => {
        try {
          // Get primary phone
          const { data: phones } = await data.supabase
            .from('business_phone_numbers')
            .select('phone_number, status')
            .eq('business_id', business.id)
            .eq('status', 'active')
            .limit(1);
          
          // Get primary address
          const { data: addresses } = await data.supabase
            .from('business_full_addresses')
            .select('street_address, city, state_abbreviation, zip_code')
            .eq('business_id', business.id)
            .eq('status', 'active')
            .limit(1);
          
          // Return enriched business object
          return {
            ...business,
            phone: phones && phones.length > 0 ? phones[0].phone_number : null,
            location: addresses && addresses.length > 0 
              ? `${addresses[0].city}${addresses[0].state_abbreviation ? ', ' + addresses[0].state_abbreviation : ''}`
              : null
          };
        } catch (error) {
          console.error(`Error fetching details for business ${business.id}:`, error);
          return business; // Return the business without the additional details
        }
      }));
      
      businesses.set(enrichedBusinesses);
      applySearch(); // Apply any current search query
    } catch (err) {
      console.error('Error fetching businesses:', err);
      businessesError.set('Failed to load businesses');
    } finally {
      isLoadingBusinesses.set(false);
    }
  }
  
  // Apply search to businesses
  function applySearch() {
    if (!$searchQuery.trim()) {
      filteredBusinesses.set($businesses);
      return;
    }
    
    const query = $searchQuery.toLowerCase().trim();
    const filtered = $businesses.filter(business => {
      // Search in various fields
      return (
        (business.business_name && business.business_name.toLowerCase().includes(query)) ||
        (business.phone && business.phone.toLowerCase().includes(query)) ||
        (business.location && business.location.toLowerCase().includes(query))
      );
    });
    
    filteredBusinesses.set(filtered);
  }
  
  // Re-fetch businesses when workspace changes
  $: if ($workspaceStore.currentWorkspace) {
    fetchBusinesses();
  }
  
  // Reapply search whenever search query or businesses change
  $: if ($searchQuery !== undefined || $businesses) {
    applySearch();
  }
  
  // Handle business creation success
  function handleBusinessCreated() {
    fetchBusinesses();
  }
  
  // Handle business update
  function handleBusinessUpdated() {
    fetchBusinesses();
  }
  
  // Open the business form modal
  function openBusinessModal() {
    isBusinessModalOpen.set(true);
  }
  
  // Close the business form modal
  function closeBusinessModal() {
    isBusinessModalOpen.set(false);
  }
  
  // View business details
  function viewBusinessDetails(businessId: string) {
    selectedBusinessId.set(businessId);
    isBusinessDetailsOpen.set(true);
  }
  
  // Close business details
  function closeBusinessDetails() {
    isBusinessDetailsOpen.set(false);
    selectedBusinessId.set(null);
  }
  
  // Search businesses
  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery.set(target.value);
  }
</script>

<svelte:head>
  <title>Businesses | Engagement Portal</title>
</svelte:head>

<div class="h-full w-full p-6 overflow-y-auto">
  {#if $workspaceStore.isLoading}
    <div class="flex justify-center items-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  {:else if !$workspaceStore.currentWorkspace}
    <div class="bg-white p-8 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">No Workspace Selected</h2>
      <p class="text-gray-600">
        Please select a workspace from the dropdown in the sidebar to continue.
      </p>
    </div>
  {:else}
    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Businesses</h1>
          <p class="text-gray-600">Manage businesses for {$workspaceStore.currentWorkspace.name}</p>
        </div>
        <div>
          <button 
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            on:click={openBusinessModal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Business
          </button>
        </div>
      </div>
      
      <!-- Search and Filters -->
      <div class="bg-white p-4 rounded-lg shadow mb-6">
        <div class="flex items-center">
          <div class="flex-1">
            <div class="relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search businesses..."
                value={$searchQuery}
                on:input={handleSearchInput}
                class="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div class="ml-4">
            <button
              type="button"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>
      </div>
      
      <!-- Businesses Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if $isLoadingBusinesses}
              <tr>
                <td colspan="5" class="px-6 py-4 text-center">
                  <div class="flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                </td>
              </tr>
            {:else if $businessesError}
              <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                  {$businessesError}
                </td>
              </tr>
            {:else if $filteredBusinesses.length === 0}
              <!-- If no businesses, show empty state -->
              <tr>
                <td colspan="5" class="px-6 py-12 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p class="text-gray-500 text-lg">No businesses found</p>
                  <p class="text-gray-400 mt-1">Add your first business to get started</p>
                  <button
                    on:click={openBusinessModal}
                    class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Add a Business
                  </button>
                </td>
              </tr>
            {:else}
              <!-- Display business list -->
              {#each $filteredBusinesses as business (business.id)}
                <tr class="hover:bg-gray-50 cursor-pointer" on:click={() => viewBusinessDetails(business.id)}>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {business.business_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{business.location || '—'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{business.phone || '—'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      class="text-blue-600 hover:text-blue-900 mr-3"
                      on:click|stopPropagation={() => viewBusinessDetails(business.id)}
                    >
                      View
                    </button>
                    <button 
                      class="text-gray-600 hover:text-gray-900"
                      on:click|stopPropagation={() => viewBusinessDetails(business.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Business Form Modal -->
<BusinessFormModal 
  isOpen={$isBusinessModalOpen} 
  supabase={data.supabase} 
  on:close={closeBusinessModal}
  on:success={handleBusinessCreated}
/>

<!-- Business Details Sheet -->
{#if $isBusinessDetailsOpen}
  <BusinessDetailsSheet 
    isOpen={$isBusinessDetailsOpen}
    businessId={$selectedBusinessId}
    supabase={data.supabase}
    on:close={closeBusinessDetails}
    on:updated={handleBusinessUpdated}
  />
{/if}