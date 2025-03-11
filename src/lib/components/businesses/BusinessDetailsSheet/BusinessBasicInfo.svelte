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
  
  <div>
    <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
    <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
      <div class="sm:col-span-4">
        <label for="business_name" class="block text-sm font-medium text-gray-700">Business Name*</label>
        <div class="mt-1">
          <input 
            type="text" 
            id="business_name" 
            bind:value={$formData.business_name}
            on:change={handleChange}
            class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
            required
          />
        </div>
      </div>
      
      <div class="sm:col-span-2">
        <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
        <div class="mt-1">
          <select 
            id="status" 
            bind:value={$formData.status}
            on:change={handleChange}
            class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </div>
  </div>