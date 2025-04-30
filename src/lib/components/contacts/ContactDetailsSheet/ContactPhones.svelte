<!--  src/lib/components/contacts/ContactDetailsSheet/ContactPhones.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let phoneNumbers;
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  
  function handleChange() {
    dispatch('change');
  }
  
  function addPhone() {
    // Create a new empty phone number entry with proper flags
    phoneNumbers.update(items => [...items, { 
      phone_number: '', // Start with empty string, not null
      status: 'active',
      isNew: true,  // This flag will ensure it's treated as a new entry for the API
      isModified: false,
      isDeleted: false
    }]);
    console.log('Added new phone number entry with flags:', { isNew: true, isModified: false, isDeleted: false });
    handleChange();
  }
  
  function removePhone(index) {
    phoneNumbers.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      // Initialize flags if they don't exist
      if (item.isNew === undefined) item.isNew = false;
      if (item.isModified === undefined) item.isModified = false;
      if (item.isDeleted === undefined) item.isDeleted = false;
      
      if (item.id) {
        // For existing items, mark as deleted
        item.isDeleted = true;
        console.log(`Phone ${index} with ID ${item.id} marked as deleted`);
      } else {
        // For new items, just remove from array
        updatedItems.splice(index, 1);
        console.log(`New phone at index ${index} removed from array`);
      }
      
      return updatedItems;
    });
    handleChange();
  }
  
  function updatePhone(index, field, value) {
    phoneNumbers.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      // Initialize flags if they don't exist
      if (item.isNew === undefined) item.isNew = false;
      if (item.isModified === undefined) item.isModified = false;
      if (item.isDeleted === undefined) item.isDeleted = false;
      
      if (item.id && !item.isNew) {
        // Mark as modified for existing items
        item.isModified = true;
        console.log(`Phone ${index} marked as modified:`, item);
      }
      
      // For phone_number field, ensure it's not null
      if (field === 'phone_number') {
        // Trim the value and store it, or empty string if null/undefined
        item[field] = value ? value.trim() : '';
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
    <h2 class="text-lg font-medium text-gray-900">Phone Numbers</h2>
    <button
      type="button"
      class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
      on:click={addPhone}
      disabled={isSaving}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add Phone
    </button>
  </div>
  
  {#each $phoneNumbers.filter(item => !item.isDeleted) as phone, i}
    <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
      <button 
        type="button" 
        class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
        on:click={() => removePhone(i)}
        disabled={isSaving}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div class="grid grid-cols-1 gap-y-3 gap-x-4 sm:grid-cols-6">
        <div class="sm:col-span-4">
          <label for="phone_{i}" class="block text-sm font-medium text-gray-700">Phone Number</label>
          <div class="mt-1">
            <input 
              type="tel" 
              id="phone_{i}" 
              value={phone.phone_number}
              on:input={(e) => updatePhone(i, 'phone_number', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
            />
          </div>
        </div>
        
        <div class="sm:col-span-2">
          <label for="phone_status_{i}" class="block text-sm font-medium text-gray-700">Status</label>
          <div class="mt-1">
            <select 
              id="phone_status_{i}" 
              value={phone.status}
              on:change={(e) => updatePhone(i, 'status', e.target.value)}
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={isSaving}
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
  
  {#if $phoneNumbers.filter(item => !item.isDeleted).length === 0}
    <div class="border border-dashed rounded-md p-6 text-center text-gray-500">
      <p>No phone numbers added yet.</p>
      <button
        type="button"
        class="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        on:click={addPhone}
        disabled={isSaving}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Phone
      </button>
    </div>
  {/if}
</div>