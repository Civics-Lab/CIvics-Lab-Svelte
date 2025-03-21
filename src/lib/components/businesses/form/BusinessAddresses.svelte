<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { FormData, BusinessFormErrors, Address, StateOption } from './types';
  
  export let formData: Writable<FormData>;
  export let errors: Writable<BusinessFormErrors>;
  export let isSubmitting: Writable<boolean>;
  export let stateOptions: Writable<StateOption[]>;
  
  function addAddress() {
    $formData.addresses = [...$formData.addresses, {
      street_address: '',
      secondary_street_address: '',
      city: '',
      state_id: '',
      zip_code: '',
      status: 'active'
    }];
  }
  
  function removeAddress(index: number) {
    $formData.addresses = $formData.addresses.filter((_, i) => i !== index);
  }
</script>

<div class="mt-8">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-medium text-gray-900">Addresses</h2>
    <button
      type="button"
      class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      on:click={addAddress}
      disabled={$isSubmitting}
      aria-label="Add address"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Address
    </button>
  </div>
  
  {#each $formData.addresses as address, i}
    <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
      {#if i > 0}
        <button 
          type="button" 
          class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
          on:click={() => removeAddress(i)}
          disabled={$isSubmitting}
          aria-label="Remove address"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      
      <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-6">
          <label for="street_{i}" class="block text-sm font-medium text-gray-700">Street Address</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="street_{i}" 
              bind:value={address.street_address}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors[`address_${i}_street`] ? 'border-red-300' : ''}"
              disabled={$isSubmitting}
            />
          </div>
          {#if $errors[`address_${i}_street`]}
            <p class="mt-1 text-sm text-red-600">{$errors[`address_${i}_street`]}</p>
          {/if}
        </div>
        
        <div class="sm:col-span-6">
          <label for="street2_{i}" class="block text-sm font-medium text-gray-700">Secondary Address</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="street2_{i}" 
              bind:value={address.secondary_street_address}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
              placeholder="Apt, Suite, Unit, etc."
            />
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="city_{i}" class="block text-sm font-medium text-gray-700">City</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="city_{i}" 
              bind:value={address.city}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors[`address_${i}_city`] ? 'border-red-300' : ''}"
              disabled={$isSubmitting}
            />
          </div>
          {#if $errors[`address_${i}_city`]}
            <p class="mt-1 text-sm text-red-600">{$errors[`address_${i}_city`]}</p>
          {/if}
        </div>
        
        <div class="sm:col-span-2">
          <label for="state_{i}" class="block text-sm font-medium text-gray-700">State</label>
          <div class="mt-1">
            <select 
              id="state_{i}" 
              bind:value={address.state_id}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors[`address_${i}_state`] ? 'border-red-300' : ''}"
              disabled={$isSubmitting}
            >
              <option value="">Select State</option>
              {#each $stateOptions as option}
                <option value={option.id}>{option.name}</option>
              {/each}
            </select>
          </div>
          {#if $errors[`address_${i}_state`]}
            <p class="mt-1 text-sm text-red-600">{$errors[`address_${i}_state`]}</p>
          {/if}
        </div>
        
        <div class="sm:col-span-2">
          <label for="zip_{i}" class="block text-sm font-medium text-gray-700">ZIP Code (5-digit or 5+4 format)</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="zip_{i}" 
              bind:value={address.zip_code}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors[`address_${i}_zip`] || $errors[`address_${i}_zip_format`] ? 'border-red-300' : ''}"
              disabled={$isSubmitting}
              placeholder="12345 or 12345-6789"
            />
          </div>
          {#if $errors[`address_${i}_zip`]}
            <p class="mt-1 text-sm text-red-600">{$errors[`address_${i}_zip`]}</p>
          {/if}
          {#if $errors[`address_${i}_zip_format`]}
            <p class="mt-1 text-sm text-red-600">{$errors[`address_${i}_zip_format`]}</p>
          {/if}
        </div>
        
        <div class="sm:col-span-2">
          <label for="address_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
          <div class="mt-1">
            <select 
              id="address_status_{i}" 
              bind:value={address.status}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="moved">Moved</option>
              <option value="wrong address">Wrong Address</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>
