<!-- src/lib/components/contacts/ContactDetailsSheet/ContactAddresses.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let addresses;
  export let stateOptions;
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  
  function handleChange() {
    dispatch('change');
  }
  
  function addAddress() {
    addresses.update(items => [...items, { 
      street_address: '', 
      secondary_street_address: '', 
      city: '', 
      state_id: '', 
      zip_code: '', 
      status: 'active',
      isNew: true  // This flag will ensure it's treated as a new entry for the API
    }]);
    console.log('Added new address entry');
    handleChange();
  }
  
  function removeAddress(index) {
    addresses.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      if (item.id) {
        // For existing items, mark as deleted
        item.isDeleted = true;
      } else {
        // For new items, just remove from array
        updatedItems.splice(index, 1);
      }
      
      return updatedItems;
    });
    handleChange();
  }
  
  function updateAddress(index, field, value) {
    addresses.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      // Initialize flags if they don't exist
      if (item.isNew === undefined) item.isNew = false;
      if (item.isModified === undefined) item.isModified = false;
      if (item.isDeleted === undefined) item.isDeleted = false;
      
      if (item.id && !item.isNew) {
        // Mark as modified for existing items
        item.isModified = true;
      }
      
      // Ensure string fields are not null
      if (['street_address', 'secondary_street_address', 'city', 'zip_code'].includes(field)) {
        // Trim the value and store it, or empty string if null/undefined
        item[field] = value ? value.trim() : '';
        
        // If updating zip_code, clear any previous zipCodeId to ensure
        // the server processes the new zip_code value
        if (field === 'zip_code') {
          // Clear the zipCodeId so the server will process the new zip_code
          item.zipCodeId = null;
          console.log('Updating zip code to:', value, '- cleared zipCodeId');
        }
      } else {
        item[field] = value;
      }
      
      return updatedItems;
    });
    handleChange();
  }
</script>

<div>
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-medium text-gray-900">Addresses</h2>
    <button
      type="button"
      class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      on:click={addAddress}
      disabled={isSaving}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Address
    </button>
  </div>
  
  {#each $addresses.filter(item => !item.isDeleted) as address, i}
    <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
      <button 
        type="button" 
        class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
        on:click={() => removeAddress(i)}
        disabled={isSaving}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-6">
          <label for="street_{i}" class="block text-sm font-medium text-gray-700">Street Address</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="street_{i}" 
              value={address.street_address}
              on:input={(e) => updateAddress(i, 'street_address', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
            />
          </div>
        </div>
        
        <div class="sm:col-span-6">
          <label for="street2_{i}" class="block text-sm font-medium text-gray-700">Secondary Address</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="street2_{i}" 
              value={address.secondary_street_address}
              on:input={(e) => updateAddress(i, 'secondary_street_address', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
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
              value={address.city}
              on:input={(e) => updateAddress(i, 'city', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
            />
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="state_{i}" class="block text-sm font-medium text-gray-700">State</label>
          <div class="mt-1">
            <select 
              id="state_{i}" 
              value={address.state_id}
              on:change={(e) => updateAddress(i, 'state_id', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
            >
              <option value="">Select State</option>
              {#if $stateOptions && $stateOptions.length > 0}
                {#each $stateOptions as option}
                  <option value={option.id}>{option.name} ({option.abbreviation})</option>
                {/each}
              {:else}
                <option value="" disabled>Loading states...</option>
              {/if}
            </select>
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="zip_{i}" class="block text-sm font-medium text-gray-700">ZIP Code</label>
          <div class="mt-1">
            <input 
              type="text" 
              id="zip_{i}" 
              value={address.zip_code}
              on:input={(e) => updateAddress(i, 'zip_code', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
              placeholder="Enter ZIP code"
            />
            <p class="mt-1 text-xs text-gray-500">
              Enter ZIP code directly - it will be linked or created automatically
            </p>
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="address_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
          <div class="mt-1">
            <select 
              id="address_status_{i}" 
              value={address.status}
              on:change={(e) => updateAddress(i, 'status', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
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
  
  {#if $addresses.filter(item => !item.isDeleted).length === 0}
    <div class="border border-dashed rounded-md p-6 text-center text-gray-500">
      <p>No addresses added yet.</p>
      <button
        type="button"
        class="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        on:click={addAddress}
        disabled={isSaving}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Address
      </button>
    </div>
  {/if}
</div>