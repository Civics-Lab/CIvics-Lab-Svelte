<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { FormData, BusinessFormErrors } from './types';
  
  export let formData: Writable<FormData>;
  export let errors: Writable<BusinessFormErrors>;
  export let isSubmitting: Writable<boolean>;
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-lg font-medium text-gray-900">Business Information</h2>
    <p class="mt-1 text-sm text-gray-500">
      Add basic information about the business.
    </p>
  </div>
  
  <div>
    <label for="business_name" class="block text-sm font-medium text-gray-700">Business Name*</label>
    <div class="mt-1">
      <input 
        type="text" 
        id="business_name" 
        bind:value={$formData.business_name}
        class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md {$errors.business_name ? 'border-red-300' : ''}"
        disabled={$isSubmitting}
      />
    </div>
    {#if $errors.business_name}
      <p class="mt-1 text-sm text-red-600">{$errors.business_name}</p>
    {/if}
  </div>
  
  <div>
    <label for="business_status" class="block text-sm font-medium text-gray-700">Status</label>
    <div class="mt-1">
      <select 
        id="business_status" 
        bind:value={$formData.status}
        class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
        disabled={$isSubmitting}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="lead">Lead</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  </div>
</div>
