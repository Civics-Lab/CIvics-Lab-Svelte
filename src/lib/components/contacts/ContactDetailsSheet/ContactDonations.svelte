<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { formatCurrency } from '$lib/utils/formatters';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import { fetchContactDonations } from '$lib/services/donationService';
  
  // Props
  export let contactId: string;
  export let isSaving: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  // State
  const isLoading = writable(true);
  const error = writable<string | null>(null);
  const donations = writable<any[]>([]);
  const totalDonationAmount = writable(0);
  const averageDonationAmount = writable(0);
  const donationsThisMonth = writable(0);
  const donationsThisMonthAmount = writable(0);
  
  // Selected donation for modal
  const selectedDonation = writable<any>(null);
  const showDonationModal = writable(false);
  
  // Derivations
  const donationCount = derived(donations, $donations => $donations.length);

  // Format date to YYYY-MM-DD
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Function to fetch donations
  async function fetchDonations() {
    if (!contactId) return;
    
    isLoading.set(true);
    error.set(null);
    
    try {
      console.log('Fetching donations for contact:', contactId);
      
      // Fetch donations using the API service
      const data = await fetchContactDonations(contactId);
      
      // Format donations for display
      const donationsWithFormattedDates = data.map(donation => ({
        ...donation,
        formattedDate: formatDate(donation.createdAt || donation.created_at),
        formattedAmount: formatCurrency(donation.amount)
      }));
      
      donations.set(donationsWithFormattedDates);
      
      // Calculate total donation amount
      const total = donationsWithFormattedDates.reduce((sum, donation) => sum + donation.amount, 0);
      totalDonationAmount.set(total);
      
      // Calculate average donation amount
      averageDonationAmount.set(donationsWithFormattedDates.length > 0 
        ? total / donationsWithFormattedDates.length 
        : 0);
      
      // Calculate donations this month
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthDonations = donationsWithFormattedDates.filter(donation => {
        const donationDate = new Date(donation.createdAt || donation.created_at);
        return donationDate.getMonth() === thisMonth && donationDate.getFullYear() === thisYear;
      });
      
      donationsThisMonth.set(thisMonthDonations.length);
      donationsThisMonthAmount.set(thisMonthDonations.reduce((sum, donation) => sum + donation.amount, 0));
      
    } catch (err) {
      console.error('Error fetching donations:', err);
      error.set('Failed to load donations');
      
      // Set default values in case of error
      donations.set([]);
      totalDonationAmount.set(0);
      averageDonationAmount.set(0);
      donationsThisMonth.set(0);
      donationsThisMonthAmount.set(0);
    } finally {
      isLoading.set(false);
    }
  }
  
  // Function to handle donation click
  function handleDonationClick(donation: any) {
    selectedDonation.set(donation);
    showDonationModal.set(true);
  }
  
  // Function to close the donation modal
  function closeModal() {
    showDonationModal.set(false);
    selectedDonation.set(null);
  }
  
  // Initial fetch
  $: if (contactId) {
    fetchDonations();
  }
</script>

<div class="rounded-md bg-white shadow-sm border border-gray-200 overflow-hidden">
  <div class="px-4 py-5 sm:p-6">
    <h3 class="text-base font-semibold leading-6 text-gray-900 flex items-center">
      <span>Donations</span>
      {#if $isLoading}
        <LoadingSpinner size="sm" class="ml-2" />
      {/if}
    </h3>
    
    {#if $error}
      <div class="mt-3 text-sm text-red-600">{$error}</div>
    {:else}
      <!-- Donation Stats Grid -->
      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Total Amount -->
        <div class="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
          <p class="text-sm font-medium text-gray-500">Total Donations</p>
          <p class="mt-2 text-xl font-semibold text-gray-900">{formatCurrency($totalDonationAmount)}</p>
        </div>
        
        <!-- Average Donation -->
        <div class="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
          <p class="text-sm font-medium text-gray-500">Average Donation</p>
          <p class="mt-2 text-xl font-semibold text-gray-900">{formatCurrency($averageDonationAmount)}</p>
        </div>
        
        <!-- Total Count -->
        <div class="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
          <p class="text-sm font-medium text-gray-500">Total # of Donations</p>
          <p class="mt-2 text-xl font-semibold text-gray-900">{$donationCount}</p>
        </div>
        
        <!-- This Month -->
        <div class="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
          <p class="text-sm font-medium text-gray-500">This Month</p>
          <p class="mt-2 text-xl font-semibold text-gray-900">{$donationsThisMonth} ({formatCurrency($donationsThisMonthAmount)})</p>
        </div>
      </div>
      
      <!-- Donation List -->
      <div class="mt-6">
        <h4 class="text-sm font-medium text-gray-500 mb-3">Donation History</h4>
        
        {#if $donations.length === 0}
          <p class="text-sm text-gray-500 italic">No donations recorded yet.</p>
        {:else}
          <div class="overflow-hidden border border-gray-200 sm:rounded-md">
            <ul class="divide-y divide-gray-200">
              {#each $donations as donation (donation.id)}
                <li 
                  class="px-4 py-3 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  on:click={() => handleDonationClick(donation)}
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {donation.formattedAmount}
                      </p>
                      <p class="text-xs text-gray-500">
                        {donation.formattedDate}
                      </p>
                    </div>
                    <div>
                      <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                        {donation.status === 'cleared' ? 'bg-green-100 text-green-800' : 
                         donation.status === 'promise' ? 'bg-yellow-100 text-yellow-800' : 
                         donation.status === 'donated' ? 'bg-blue-100 text-blue-800' : 
                         donation.status === 'processing' ? 'bg-purple-100 text-purple-800' : 
                         'bg-gray-100 text-gray-800'}">
                        {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Donation Details Modal -->
{#if $showDonationModal && $selectedDonation}
  <div class="fixed inset-0 z-[70] overflow-y-auto" on:click|stopPropagation={closeModal}>
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div 
        class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
        on:click|stopPropagation={() => {}}
      >
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 class="text-base font-semibold leading-6 text-gray-900">Donation Details</h3>
              <div class="mt-4 space-y-3">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500">Amount</p>
                    <p class="mt-1 text-sm text-gray-900">{$selectedDonation.formattedAmount}</p>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500">Date</p>
                    <p class="mt-1 text-sm text-gray-900">{$selectedDonation.formattedDate}</p>
                  </div>
                </div>
                
                <div>
                  <p class="text-sm font-medium text-gray-500">Status</p>
                  <p class="mt-1 text-sm">
                    <span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                      {$selectedDonation.status === 'cleared' ? 'bg-green-100 text-green-800' : 
                       $selectedDonation.status === 'promise' ? 'bg-yellow-100 text-yellow-800' : 
                       $selectedDonation.status === 'donated' ? 'bg-blue-100 text-blue-800' : 
                       $selectedDonation.status === 'processing' ? 'bg-purple-100 text-purple-800' : 
                       'bg-gray-100 text-gray-800'}">
                      {$selectedDonation.status.charAt(0).toUpperCase() + $selectedDonation.status.slice(1)}
                    </span>
                  </p>
                </div>
                
                <div>
                  <p class="text-sm font-medium text-gray-500">ID</p>
                  <p class="mt-1 text-sm text-gray-900">{$selectedDonation.id}</p>
                </div>
                
                <!-- Created/Updated timestamps -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-500">Created</p>
                    <p class="mt-1 text-sm text-gray-900">{formatDate($selectedDonation.created_at)}</p>
                  </div>
                  {#if $selectedDonation.updated_at}
                    <div>
                      <p class="text-sm font-medium text-gray-500">Last Updated</p>
                      <p class="mt-1 text-sm text-gray-900">{formatDate($selectedDonation.updated_at)}</p>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button 
            type="button" 
            class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
            on:click={closeModal}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
