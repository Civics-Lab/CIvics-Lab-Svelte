<!-- src/lib/components/donations/DonationDetailsSheet/DonationBasicInfo.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  
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
</script>

<div>
  <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
  <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
    <!-- Donor Information (read-only) -->
    <div class="sm:col-span-6">
      <label class="block text-sm font-medium text-gray-700">Donor</label>
      <div class="mt-1 text-sm text-gray-900">
        {#if $donor}
          <div class="flex items-center">
            <span class="font-medium">{$donor.name}</span>
            <span class="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {$donor.type === 'contact' ? 'Person' : 'Business'}
            </span>
          </div>
        {:else}
          <span class="text-gray-500">No donor associated with this donation</span>
        {/if}
      </div>
    </div>
    
    <!-- Amount -->
    <div class="sm:col-span-3">
      <label for="amount" class="block text-sm font-medium text-gray-700">Amount*</label>
      <div class="mt-1 relative rounded-md shadow-sm">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span class="text-gray-500 sm:text-sm">$</span>
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          id="amount"
          class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
          placeholder="0.00"
          bind:value={formattedAmount}
          on:input={handleAmountChange}
          disabled={isSaving}
          required
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span class="text-gray-500 sm:text-sm">USD</span>
        </div>
      </div>
    </div>
    
    <!-- Status -->
    <div class="sm:col-span-3">
      <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
      <div class="mt-1">
        <select
          id="status"
          class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
    
    <!-- Payment Type -->
    <div class="sm:col-span-3">
      <label for="payment_type" class="block text-sm font-medium text-gray-700">Payment Type</label>
      <div class="mt-1">
        <select
          id="payment_type"
          class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
    </div>
    
    <!-- Donation Date -->
    <div class="sm:col-span-3">
      <label for="donation_date" class="block text-sm font-medium text-gray-700">Donation Date</label>
      <div class="mt-1">
        <input
          type="date"
          id="donation_date"
          class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
          bind:value={$formData.donation_date}
          on:change={handleChange}
          disabled={isSaving}
        />
      </div>
    </div>
    
    <!-- Notes -->
    <div class="sm:col-span-6">
      <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
      <div class="mt-1">
        <textarea
          id="notes"
          rows="4"
          class="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Add any additional notes..."
          bind:value={$formData.notes}
          on:input={handleChange}
          disabled={isSaving}
        ></textarea>
      </div>
    </div>
  </div>
</div>
