<!-- src/lib/components/businesses/BusinessDetailsSheet/BusinessAddresses.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Plus, X, MapPin } from '@lucide/svelte';
  
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
      isNew: true 
    }]);
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
      
      if (item.id && !item.isNew) {
        // Mark as modified for existing items
        item.isModified = true;
      }
      
      item[field] = value;
      return updatedItems;
    });
    handleChange();
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between border-b border-slate-200 pb-4">
    <div>
      <h3 class="text-lg font-semibold leading-6 text-slate-900">Addresses</h3>
      <p class="mt-1 text-sm text-slate-600">Manage business locations and mailing addresses.</p>
    </div>
    <button
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 h-9 px-3"
      on:click={addAddress}
      disabled={isSaving}
    >
      <Plus class="h-4 w-4" />
      Add Address
    </button>
  </div>
  
  <div class="space-y-4">
    {#each $addresses.filter(item => !item.isDeleted) as address, i}
      <div class="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button 
          type="button" 
          class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors" 
          on:click={() => removeAddress(i)}
          disabled={isSaving}
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Remove address</span>
        </button>
        
        <div class="space-y-4 pr-8">
          <!-- Street Address -->
          <div class="space-y-2">
            <label for="street_{i}" class="block text-sm font-medium text-slate-700">
              Street Address
            </label>
            <input 
              type="text" 
              id="street_{i}" 
              value={address.street_address}
              on:input={(e) => updateAddress(i, 'street_address', e.target.value)}
              class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              placeholder="123 Main Street"
            />
          </div>
          
          <!-- Secondary Address -->
          <div class="space-y-2">
            <label for="street2_{i}" class="block text-sm font-medium text-slate-700">
              Secondary Address
            </label>
            <input 
              type="text" 
              id="street2_{i}" 
              value={address.secondary_street_address}
              on:input={(e) => updateAddress(i, 'secondary_street_address', e.target.value)}
              class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              placeholder="Suite 100, Floor 3, etc."
            />
          </div>
          
          <!-- City, State, ZIP Row -->
          <div class="grid gap-4 md:grid-cols-6">
            <div class="md:col-span-2 space-y-2">
              <label for="city_{i}" class="block text-sm font-medium text-slate-700">City</label>
              <input 
                type="text" 
                id="city_{i}" 
                value={address.city}
                on:input={(e) => updateAddress(i, 'city', e.target.value)}
                class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                placeholder="City name"
              />
            </div>
            
            <div class="md:col-span-2 space-y-2">
              <label for="state_{i}" class="block text-sm font-medium text-slate-700">State</label>
              <select 
                id="state_{i}" 
                value={address.state_id}
                on:change={(e) => updateAddress(i, 'state_id', e.target.value)}
                class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
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
            
            <div class="md:col-span-2 space-y-2">
              <label for="zip_{i}" class="block text-sm font-medium text-slate-700">ZIP Code</label>
              <input 
                type="text" 
                id="zip_{i}" 
                value={address.zip_code}
                on:input={(e) => updateAddress(i, 'zip_code', e.target.value)}
                class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSaving}
                placeholder="12345"
              />
            </div>
          </div>
          
          <!-- Status -->
          <div class="space-y-2">
            <label for="address_status_{i}" class="block text-sm font-medium text-slate-700">Status</label>
            <select 
              id="address_status_{i}" 
              value={address.status}
              on:change={(e) => updateAddress(i, 'status', e.target.value)}
              class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="moved">Moved</option>
              <option value="wrong address">Wrong Address</option>
            </select>
          </div>
          
          <!-- Helper text -->
          <p class="text-xs text-slate-500">
            ZIP code will be linked or created automatically when saved.
          </p>
        </div>
      </div>
    {/each}
    
    {#if $addresses.filter(item => !item.isDeleted).length === 0}
      <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <MapPin class="h-8 w-8 text-slate-400 mb-3" />
        <h3 class="text-sm font-medium text-slate-900 mb-1">No addresses added</h3>
        <p class="text-sm text-slate-600 mb-4">Add business locations and mailing addresses.</p>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-9 px-3"
          on:click={addAddress}
          disabled={isSaving}
        >
          <Plus class="h-4 w-4" />
          Add First Address
        </button>
      </div>
    {/if}
  </div>
</div>