<!-- src/routes/engage/donations/+page.svelte -->
<script lang="ts">
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import DonationFormModal from '$lib/components/DonationFormModal.svelte';
    import { toastStore } from '$lib/stores/toastStore';
    import type { PageData } from './$types';
    import { writable } from 'svelte/store';
    
    export let data: PageData;
    
    // State for the donation form modal
    const isDonationModalOpen = writable(false);
    
    // Donations data
    const donations = writable<any[]>([]);
    const isLoadingDonations = writable(false);
    const donationsError = writable<string | null>(null);
    
    // Donation stats
    const donationStats = writable({
      totalAmount: 0,
      averageAmount: 0,
      thisMonthAmount: 0,
      totalCount: 0,
      thisMonthCount: 0
    });
    
    // Function to fetch donations
    async function fetchDonations() {
      if (!$workspaceStore.currentWorkspace) return;
      
      isLoadingDonations.set(true);
      donationsError.set(null);
      
      try {
        const { data: fetchedDonations, error } = await data.supabase
          .from('donations')
          .select(`
            id,
            amount,
            status,
            created_at,
            contacts:contact_id (id, first_name, last_name),
            businesses:business_id (id, business_name)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        donations.set(fetchedDonations || []);
        
        // Calculate donation stats
        if (fetchedDonations && fetchedDonations.length > 0) {
          const total = fetchedDonations.reduce((sum, donation) => sum + donation.amount, 0);
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const thisMonthDonations = fetchedDonations.filter(donation => {
            const donationDate = new Date(donation.created_at);
            return donationDate >= startOfMonth;
          });
          
          const thisMonthTotal = thisMonthDonations.reduce((sum, donation) => sum + donation.amount, 0);
          
          donationStats.set({
            totalAmount: total,
            averageAmount: total / fetchedDonations.length,
            thisMonthAmount: thisMonthTotal,
            totalCount: fetchedDonations.length,
            thisMonthCount: thisMonthDonations.length
          });
        }
      } catch (error) {
        console.error('Error fetching donations:', error);
        donationsError.set('Failed to load donations');
      } finally {
        isLoadingDonations.set(false);
      }
    }
    
    // Re-fetch donations when workspace changes
    $: if ($workspaceStore.currentWorkspace) {
      fetchDonations();
    }
    
    // Handle donation creation success
    function handleDonationCreated() {
      fetchDonations();
    }
    
    function openDonationModal() {
      isDonationModalOpen.set(true);
    }
    
    function closeDonationModal() {
      isDonationModalOpen.set(false);
    }
    
    // Format currency
    function formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    }
    
    // Get donor name from donation
    function getDonorName(donation: any): string {
      if (donation.contacts) {
        return `${donation.contacts.first_name} ${donation.contacts.last_name}`;
      } else if (donation.businesses) {
        return donation.businesses.business_name;
      }
      return '—';
    }
  </script>
  
  <svelte:head>
    <title>Donations | Engagement Portal</title>
  </svelte:head>
  
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
    <div class="pb-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Donations</h1>
          <p class="text-gray-600">Manage donations for {$workspaceStore.currentWorkspace.name}</p>
        </div>
        <div>
          <button 
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            on:click={openDonationModal}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Record Donation
          </button>
        </div>
      </div>
      
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Total Donations -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-sm font-medium text-gray-500 mb-1">Total Donations</h2>
          <p class="text-3xl font-bold text-gray-900">
            {$isLoadingDonations ? '—' : formatCurrency($donationStats.totalAmount)}
          </p>
          <div class="mt-2 flex items-center text-sm text-gray-500">
            <span>{$isLoadingDonations ? '—' : $donationStats.totalCount} donations recorded</span>
          </div>
        </div>
        
        <!-- Average Donation -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-sm font-medium text-gray-500 mb-1">Average Donation</h2>
          <p class="text-3xl font-bold text-gray-900">
            {$isLoadingDonations ? '—' : $donationStats.totalCount > 0 
              ? formatCurrency($donationStats.averageAmount)
              : '$0.00'
            }
          </p>
          <div class="mt-2 flex items-center text-sm text-gray-500">
            <span>
              {$isLoadingDonations ? '—' : $donationStats.totalCount > 0 
                ? 'Based on ' + $donationStats.totalCount + ' donations'
                : 'No donations to average'
              }
            </span>
          </div>
        </div>
        
        <!-- This Month -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-sm font-medium text-gray-500 mb-1">This Month</h2>
          <p class="text-3xl font-bold text-gray-900">
            {$isLoadingDonations ? '—' : formatCurrency($donationStats.thisMonthAmount)}
          </p>
          <div class="mt-2 flex items-center text-sm text-gray-500">
            <span>
              {$isLoadingDonations ? '—' : $donationStats.thisMonthCount} donations this month
            </span>
          </div>
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
                placeholder="Search donations..."
                class="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div class="ml-4">
            <button
              type="button"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>
      </div>
      
      <!-- Donations Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
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
            {#if $isLoadingDonations}
              <tr>
                <td colspan="5" class="px-6 py-4 text-center">
                  <div class="flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                </td>
              </tr>
            {:else if $donationsError}
              <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                  {$donationsError}
                </td>
              </tr>
            {:else if $donations.length === 0}
              <!-- If no donations, show empty state -->
              <tr>
                <td colspan="5" class="px-6 py-12 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-gray-500 text-lg">No donations recorded</p>
                  <p class="text-gray-400 mt-1">Record your first donation to get started</p>
                  <button
                    on:click={openDonationModal}
                    class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                  >
                    Record a Donation
                  </button>
                </td>
              </tr>
            {:else}
              <!-- Display donation list -->
              {#each $donations as donation (donation.id)}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {getDonorName(donation)}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 font-medium">
                      {formatCurrency(donation.amount)}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      {donation.status === 'cleared' ? 'bg-green-100 text-green-800' : 
                       donation.status === 'promise' ? 'bg-yellow-100 text-yellow-800' : 
                       donation.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                       'bg-purple-100 text-purple-800'}">
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href={`/engage/donations/${donation.id}`} class="text-blue-600 hover:text-blue-900 mr-3">
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
    
    <!-- Donation Form Modal -->
    <DonationFormModal 
      isOpen={$isDonationModalOpen} 
      supabase={data.supabase} 
      on:close={closeDonationModal}
      on:success={handleDonationCreated}
    />
  {/if}