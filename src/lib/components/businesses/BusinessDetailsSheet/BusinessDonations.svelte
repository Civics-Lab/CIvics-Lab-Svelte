<!-- src/lib/components/businesses/BusinessDetailsSheet/BusinessDonations.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { DollarSign, TrendingUp, Calendar, Eye, X } from '@lucide/svelte';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import type { TypedSupabaseClient } from '$lib/types/supabase';
  import { fetchBusinessDonations } from '$lib/services/donationService';
  
  // Props
  export let businessId: string;
  export let supabase: TypedSupabaseClient; // Still needed for backwards compatibility
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

  // Format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

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
    if (!businessId) return;
    
    isLoading.set(true);
    error.set(null);
    
    try {
      // Use the donation service instead of direct API call
      const data = await fetchBusinessDonations(businessId);
      
      if (data && data.length > 0) {
        // Map data to the expected format
        const donationsWithFormattedDates = data.map(donation => ({
          id: donation.id,
          amount: donation.amount,
          status: donation.status,
          notes: donation.notes,
          payment_type: donation.paymentType,
          business_id: donation.businessId,
          contact_id: donation.contactId,
          created_at: donation.createdAt,
          updated_at: donation.updatedAt,
          formattedDate: formatDate(donation.createdAt),
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
          const donationDate = new Date(donation.created_at);
          return donationDate.getMonth() === thisMonth && donationDate.getFullYear() === thisYear;
        });
        
        donationsThisMonth.set(thisMonthDonations.length);
        donationsThisMonthAmount.set(thisMonthDonations.reduce((sum, donation) => sum + donation.amount, 0));
      } else {
        donations.set([]);
        totalDonationAmount.set(0);
        averageDonationAmount.set(0);
        donationsThisMonth.set(0);
        donationsThisMonthAmount.set(0);
      }
      
    } catch (err) {
      console.error('Error fetching donations:', err);
      error.set(err.message || 'Failed to load donations');
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
  
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'promise':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'donated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cleared':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
  
  // Initial fetch
  $: if (businessId) {
    fetchDonations();
  }
</script>

<div class="space-y-6">
  <div class="border-b border-slate-200 pb-4">
    <h3 class="text-lg font-semibold leading-6 text-slate-900 flex items-center gap-2">
      <DollarSign class="h-5 w-5" />
      Business Donations
      {#if $isLoading}
        <LoadingSpinner size="sm" />
      {/if}
    </h3>
    <p class="mt-1 text-sm text-slate-600">View donation history and statistics for this business.</p>
  </div>
  
  {#if $error}
    <div class="rounded-md border border-red-200 bg-red-50 p-4">
      <p class="text-sm text-red-700">{$error}</p>
    </div>
  {:else}
    <!-- Donation Stats Grid -->
    <div class="grid gap-4 md:grid-cols-4">
      <!-- Total Amount -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <DollarSign class="h-5 w-5 text-green-600" />
          <div>
            <p class="text-sm font-medium text-slate-600">Total Raised</p>
            <p class="text-lg font-semibold text-slate-900">{formatCurrency($totalDonationAmount)}</p>
          </div>
        </div>
      </div>
      
      <!-- Average Donation -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <TrendingUp class="h-5 w-5 text-blue-600" />
          <div>
            <p class="text-sm font-medium text-slate-600">Average</p>
            <p class="text-lg font-semibold text-slate-900">{formatCurrency($averageDonationAmount)}</p>
          </div>
        </div>
      </div>
      
      <!-- Total Count -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <Eye class="h-5 w-5 text-purple-600" />
          <div>
            <p class="text-sm font-medium text-slate-600">Total Count</p>
            <p class="text-lg font-semibold text-slate-900">{$donationCount}</p>
          </div>
        </div>
      </div>
      
      <!-- This Month -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2">
          <Calendar class="h-5 w-5 text-orange-600" />
          <div>
            <p class="text-sm font-medium text-slate-600">This Month</p>
            <p class="text-lg font-semibold text-slate-900">{$donationsThisMonth}</p>
            <p class="text-xs text-slate-500">{formatCurrency($donationsThisMonthAmount)}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Donation List -->
    {#if $donations.length === 0}
      <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <DollarSign class="h-8 w-8 text-slate-400 mb-3" />
        <h3 class="text-sm font-medium text-slate-900 mb-1">No donations yet</h3>
        <p class="text-sm text-slate-600">Donations from this business will appear here once received.</p>
      </div>
    {:else}
      <div class="space-y-3">
        <h4 class="text-sm font-medium text-slate-900">Recent Donations</h4>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          {#each $donations as donation (donation.id)}
            <div 
              class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm hover:bg-slate-50 cursor-pointer transition-colors"
              on:click={() => handleDonationClick(donation)}
            >
              <div class="flex items-center gap-3">
                <DollarSign class="h-4 w-4 text-green-600" />
                <div>
                  <p class="font-medium text-slate-900">{donation.formattedAmount}</p>
                  <p class="text-slate-500">{donation.formattedDate}</p>
                </div>
              </div>
              
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium {getStatusBadgeClass(donation.status)}">
                {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Donation Details Modal -->
{#if $showDonationModal && $selectedDonation}
  <div class="fixed inset-0 z-[70] flex min-h-full items-center justify-center p-4" on:click|stopPropagation={closeModal}>
    <div 
      class="relative w-full max-w-lg transform overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-lg transition-all"
      on:click|stopPropagation={() => {}}
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h3 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign class="h-5 w-5" />
          Donation Details
        </h3>
        <button 
          type="button" 
          class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          on:click={closeModal}
        >
          <X class="h-5 w-5" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <p class="text-sm font-medium text-slate-600">Amount</p>
            <p class="text-lg font-semibold text-slate-900">{$selectedDonation.formattedAmount}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-600">Date</p>
            <p class="text-sm text-slate-900">{$selectedDonation.formattedDate}</p>
          </div>
        </div>
        
        <div>
          <p class="text-sm font-medium text-slate-600 mb-2">Status</p>
          <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusBadgeClass($selectedDonation.status)}">
            {$selectedDonation.status.charAt(0).toUpperCase() + $selectedDonation.status.slice(1)}
          </span>
        </div>
        
        <div>
          <p class="text-sm font-medium text-slate-600">Donation ID</p>
          <p class="text-sm text-slate-900 font-mono">{$selectedDonation.id}</p>
        </div>
        
        <!-- Created/Updated timestamps -->
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <p class="text-sm font-medium text-slate-600">Created</p>
            <p class="text-sm text-slate-900">{formatDate($selectedDonation.created_at)}</p>
          </div>
          {#if $selectedDonation.updated_at}
            <div>
              <p class="text-sm font-medium text-slate-600">Last Updated</p>
              <p class="text-sm text-slate-900">{formatDate($selectedDonation.updated_at)}</p>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Footer -->
      <div class="border-t border-slate-200 px-6 py-4">
        <button 
          type="button" 
          class="inline-flex w-full justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          on:click={closeModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}