<!-- src/routes/engage/businesses/+page.svelte -->
<script lang="ts">
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import BusinessFormModal from '$lib/components/BusinessFormModal.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import type { PageData } from './$types';
    import { writable } from 'svelte/store';
    
    export let data: PageData;
    
    // State for the business form modal
    const isBusinessModalOpen = writable(false);
    
    // Businesses data
    const businesses = writable<any[]>([]);
    const isLoadingBusinesses = writable(false);
    const businessesError = writable<string | null>(null);
    
    // Function to fetch businesses
    async function fetchBusinesses() {
      if (!$workspaceStore.currentWorkspace) return;
      
      isLoadingBusinesses.set(true);
      businessesError.set(null);
      
      try {
        const { data: fetchedBusinesses, error } = await data.supabase
          .from('active_businesses')
          .select('*');
        
        if (error) throw error;
        
        businesses.set(fetchedBusinesses || []);
      } catch (error) {
        console.error('Error fetching businesses:', error);
        businessesError.set('Failed to load businesses');
      } finally {
        isLoadingBusinesses.set(false);
      }
    }
    
    // Re-fetch businesses when workspace changes
    $: if ($workspaceStore.currentWorkspace) {
      fetchBusinesses();
    }
    
    // Handle business creation success
    function handleBusinessCreated() {
      fetchBusinesses();
    }
    
    function openBusinessModal() {
      isBusinessModalOpen.set(true);
    }
    
    function closeBusinessModal() {
      isBusinessModalOpen.set(false);
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
              {:else if $businesses.length === 0}
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
                {#each $businesses as business (business.id)}
                  <tr>
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
                        {business.status || 'Active'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href={`/engage/businesses/${business.id}`} class="text-blue-600 hover:text-blue-900 mr-3">
                        View
                      </a>
                      <button class="text-gray-600 hover:text-gray-900">
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