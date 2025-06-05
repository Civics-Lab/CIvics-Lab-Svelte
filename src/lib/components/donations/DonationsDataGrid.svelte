<!-- src/lib/components/donations/DonationsDataGrid.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import DonationDetailsSheet from './DonationDetailsSheet.svelte';
  
  export let donations: any[] = [];
  export let isLoading: boolean = false;
  export let error: string | null = null;
  export let visibleColumns: string[] = []; 
  export let availableFields: any[] = []; 
  export let supabase: any;

  // State for donation details sheet
  const isDetailsSheetOpen = writable(false);
  const selectedDonationId = writable<string | null>(null);

  const dispatch = createEventDispatcher();
  
  // Date formatter
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  // Currency formatter
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  // Get donor name from donation
  function getDonorName(donation: any): string {
    if (donation.contacts && donation.contacts.first_name) {
      return `${donation.contacts.first_name} ${donation.contacts.last_name || ''}`.trim();
    } else if (donation.businesses && donation.businesses.business_name) {
      return donation.businesses.business_name;
    }
    return '—';
  }
  
  // Get status badge class based on status
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'cleared':
        return 'bg-green-100 text-green-800';
      case 'promise':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  }
  
  // Handle add donation click
  function handleAddDonation() {
    dispatch('addDonation');
  }
  
  // Handle view donation details
  function handleViewDonation(id: string) {
    selectedDonationId.set(id);
    isDetailsSheetOpen.set(true);
  }
</script>

<!-- Data Grid -->
<div class="flex-1 overflow-auto relative px-6">
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <!-- Donation Details Sheet -->
    <DonationDetailsSheet 
      isOpen={$isDetailsSheetOpen} 
      donationId={$selectedDonationId} 
      {supabase} 
      on:close={() => isDetailsSheetOpen.set(false)} 
      on:updated={() => dispatch('donationUpdated')}
    />
    
    {#if isLoading}
      <div class="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    {:else if error}
      <div class="text-center text-red-500 py-20">
        {error}
      </div>
    {:else if donations.length === 0}
      <div class="text-center py-20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-500 text-lg">No donations found</p>
        <p class="text-gray-400 mt-1">Add your first donation or adjust your filters</p>
        <button
          on:click={handleAddDonation}
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Record a Donation
        </button>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <!-- Always show date column -->
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              
              <!-- Show donor column -->
              <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Donor
              </th>
              
              <!-- Dynamic columns based on visible fields -->
              {#if visibleColumns.includes('amount')}
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              {/if}
              
              {#if visibleColumns.includes('status')}
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              {/if}
              
              {#if visibleColumns.includes('paymentType')}
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Type
                </th>
              {/if}
              
              {#if visibleColumns.includes('notes')}
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              {/if}
              
              <!-- Actions column always visible -->
              <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each donations as donation (donation.id)}
              <tr 
                class="hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                on:click={() => handleViewDonation(donation.id)}
                aria-label="Click to view donation details"
              >
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(donation.created_at)}
                </td>
                
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {getDonorName(donation)}
                  </div>
                </td>
                
                {#if visibleColumns.includes('amount')}
                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {formatCurrency(donation.amount)}
                    </div>
                  </td>
                {/if}
                
                {#if visibleColumns.includes('status')}
                  <td class="px-4 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusBadgeClass(donation.status)}">
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </span>
                  </td>
                {/if}
                
                {#if visibleColumns.includes('paymentType')}
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donation.paymentType || '—'}
                  </td>
                {/if}
                
                {#if visibleColumns.includes('notes')}
                  <td class="px-4 py-4 max-w-xs">
                    <div class="text-sm text-gray-900 truncate">
                      {donation.notes || '—'}
                    </div>
                  </td>
                {/if}
                
                <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    class="text-blue-600 hover:text-blue-900"
                    on:click={(e) => {
                      e.stopPropagation();
                      handleViewDonation(donation.id);
                    }}
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