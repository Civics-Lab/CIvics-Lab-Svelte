<!-- src/lib/components/donations/DonationDetailsSheet/DonationBasicInfo.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import { DollarSign, Calendar, CreditCard, User, Building } from '@lucide/svelte';
  
  export let formData;
  export let donor;
  export let statusOptions = [];
  export let paymentTypeOptions = [];
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  
  let formattedAmount = '';
  
  onMount(() => {
    // Format the initial amount
    if ($formData && $formData.amount !== undefined) {
      formattedAmount = $formData.amount.toString();
    }
  });
  
  // Watch for changes in the formData
  $: if ($formData && $formData.amount !== undefined) {
    formattedAmount = $formData.amount.toString();
  }
  
  function handleAmountChange() {
    // Parse and update the amount in formData
    const newAmount = parseFloat(formattedAmount) || 0;
    
    formData.update(fd => ({
      ...fd,
      amount: newAmount
    }));
    
    dispatch('change');
  }
  
  function handleChange() {
    dispatch('change');
  }
  
  // Format currency for display
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // Get status badge styling
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
</script>

<div class="space-y-6">
  <div class="border-b border-slate-200 pb-4">
    <h3 class="text-lg font-semibold leading-6 text-slate-900">Donation Details</h3>
    <p class="mt-1 text-sm text-slate-600">Manage the core donation information and payment details.</p>
  </div>
  
  <div class="space-y-6">
    <!-- Donor Information (read-only) -->
    <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div class="flex items-center gap-2 mb-2">
        {#if $donor?.type === 'contact'}
          <User class="h-4 w-4 text-slate-600" />
        {:else if $donor?.type === 'business'}
          <Building class="h-4 w-4 text-slate-600" />
        {:else}
          <User class="h-4 w-4 text-slate-600" />
        {/if}
        <label class="text-sm font-medium text-slate-700">Donor Information</label>
      </div>
      {#if $donor}
        <div class="flex items-center gap-3">
          <span class="font-medium text-slate-900">{$donor.name}</span>
          <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {$donor.type === 'contact' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}">
            {$donor.type === 'contact' ? 'Individual' : 'Business'}
          </span>
        </div>
      {:else}
        <span class="text-sm text-slate-500">No donor associated with this donation</span>
      {/if}
    </div>
    
    <!-- Amount and Status Row -->
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-2">
        <label for="amount" class="block text-sm font-medium text-slate-700">
          <DollarSign class="inline h-4 w-4 mr-1" />
          Amount <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-slate-500 text-sm">$</span>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            id="amount"
            class="flex h-9 w-full rounded-md border border-slate-300 bg-white pl-7 pr-12 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="0.00"
            bind:value={formattedAmount}
            on:input={handleAmountChange}
            disabled={isSaving}
            required
          />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span class="text-slate-500 text-sm">USD</span>
          </div>
        </div>
      </div>
      
      <div class="space-y-2">
        <label for="status" class="block text-sm font-medium text-slate-700">Status</label>
        <select
          id="status"
          class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          bind:value={$formData.status}
          on:change={handleChange}
          disabled={isSaving}
        >
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
    
    <!-- Payment Type and Date Row -->
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-2">
        <label for="payment_type" class="block text-sm font-medium text-slate-700">
          <CreditCard class="inline h-4 w-4 mr-1" />
          Payment Type
        </label>
        <select
          id="payment_type"
          class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          bind:value={$formData.payment_type}
          on:change={handleChange}
          disabled={isSaving}
        >
          <option value="">Select payment type</option>
          {#each paymentTypeOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
      
      <div class="space-y-2">
        <label for="donation_date" class="block text-sm font-medium text-slate-700">
          <Calendar class="inline h-4 w-4 mr-1" />
          Donation Date
        </label>
        <input
          type="date"
          id="donation_date"
          class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          bind:value={$formData.donation_date}
          on:change={handleChange}
          disabled={isSaving}
        />
      </div>
    </div>
    
    <!-- Notes -->
    <div class="space-y-2">
      <label for="notes" class="block text-sm font-medium text-slate-700">Notes</label>
      <textarea
        id="notes"
        rows="4"
        class="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Add any additional notes about this donation..."
        bind:value={$formData.notes}
        on:input={handleChange}
        disabled={isSaving}
      ></textarea>
    </div>
  </div>
</div>