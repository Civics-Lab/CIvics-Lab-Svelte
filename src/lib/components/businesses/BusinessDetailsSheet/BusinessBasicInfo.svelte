<!-- src/lib/components/businesses/BusinessDetailsSheet/BusinessBasicInfo.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let formData;
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  
  function handleChange() {
    dispatch('change');
  }
</script>

<div class="space-y-6">
  <div class="border-b border-slate-200 pb-4">
    <h3 class="text-lg font-semibold leading-6 text-slate-900">Basic Information</h3>
    <p class="mt-1 text-sm text-slate-600">Update the business's core details and status information.</p>
  </div>
  
  <div class="grid gap-6 md:grid-cols-3">
    <div class="md:col-span-2 space-y-2">
      <label for="business_name" class="block text-sm font-medium text-slate-700">
        Business Name <span class="text-red-500">*</span>
      </label>
      <input 
        type="text" 
        id="business_name" 
        bind:value={$formData.business_name}
        on:change={handleChange}
        class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving}
        required
        placeholder="Enter business name"
      />
    </div>
    
    <div class="space-y-2">
      <label for="status" class="block text-sm font-medium text-slate-700">
        Status
      </label>
      <select 
        id="status" 
        bind:value={$formData.status}
        on:change={handleChange}
        class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="closed">Closed</option>
      </select>
    </div>
  </div>
</div>