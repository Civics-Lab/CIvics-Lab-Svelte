<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { FormData, BusinessFormErrors, Phone } from './types';
  
  export let formData: Writable<FormData>;
  export let errors: Writable<BusinessFormErrors>;
  export let isSubmitting: Writable<boolean>;
  
  function addPhone() {
    $formData.phones = [...$formData.phones, { phone_number: '', status: 'active' }];
  }
  
  function removePhone(index: number) {
    $formData.phones = $formData.phones.filter((_, i) => i !== index);
  }
</script>

<div class="mt-8">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-medium text-gray-900">Phone Numbers</h2>
    <button
      type="button"
      class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      on:click={addPhone}
      disabled={$isSubmitting}
      aria-label="Add phone number"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Phone
    </button>
  </div>
  
  {#each $formData.phones as phone, i}
    <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
      {#if i > 0}
        <button 
          type="button" 
          class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
          on:click={() => removePhone(i)}
          disabled={$isSubmitting}
          aria-label="Remove phone number"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
      
      <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-4">
          <label for="phone_{i}" class="block text-sm font-medium text-gray-700">Phone Number (format: +12345678901)</label>
          <div class="mt-1">
            <input 
              type="tel" 
              id="phone_{i}" 
              bind:value={phone.phone_number}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors[`phone_${i}`] ? 'border-red-300' : ''}"
              disabled={$isSubmitting}
            />
          </div>
          {#if $errors[`phone_${i}`]}
          <p class="mt-1 text-sm text-red-600">{$errors[`phone_${i}`]}</p>
          {/if}
              {#if $errors[`phone_${i}_format`]}
                <p class="mt-1 text-sm text-red-600">{$errors[`phone_${i}_format`]}</p>
              {/if}
        </div>
        
        <div class="sm:col-span-2">
          <label for="phone_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
          <div class="mt-1">
            <select 
              id="phone_status_{i}" 
              bind:value={phone.status}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={$isSubmitting}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="wrong number">Wrong Number</option>
              <option value="disconnected">Disconnected</option>
            </select>
          </div>
        </div>
        </div>
        </div>
        {/each}
  
  {#if $errors.phone_general}
    <p class="mt-1 text-sm text-red-600">{$errors.phone_general}</p>
  {/if}
</div>
