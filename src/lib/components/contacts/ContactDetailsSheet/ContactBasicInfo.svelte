<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    // Props
    export let formData;
    export let genderOptions;
    export let raceOptions;
    export let isSaving = false;
    
    const dispatch = createEventDispatcher();
    
    function handleChange() {
      dispatch('change');
    }
  </script>
  
  <div>
    <h2 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
    <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
      <div class="sm:col-span-2">
        <label for="first_name" class="block text-sm font-medium text-gray-700">First Name*</label>
        <div class="mt-1">
          <input 
            type="text" 
            id="first_name" 
            bind:value={$formData.first_name}
            on:change={handleChange}
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
          />
        </div>
      </div>
      
      <div class="sm:col-span-2">
        <label for="middle_name" class="block text-sm font-medium text-gray-700">Middle Name</label>
        <div class="mt-1">
          <input 
            type="text" 
            id="middle_name" 
            bind:value={$formData.middle_name}
            on:change={handleChange}
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
          />
        </div>
      </div>
      
      <div class="sm:col-span-2">
        <label for="last_name" class="block text-sm font-medium text-gray-700">Last Name*</label>
        <div class="mt-1">
          <input 
            type="text" 
            id="last_name" 
            bind:value={$formData.last_name}
            on:change={handleChange}
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
          />
        </div>
      </div>
      
      <div class="sm:col-span-2">
        <label for="gender" class="block text-sm font-medium text-gray-700">Gender</label>
        <div class="mt-1">
          <select 
            id="gender" 
            bind:value={$formData.gender_id}
            on:change={handleChange}
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
          >
            <option value="">Select Gender</option>
            {#each $genderOptions as option}
              <option value={option.id}>{option.gender}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <div class="sm:col-span-2">
        <label for="race" class="block text-sm font-medium text-gray-700">Race</label>
        <div class="mt-1">
          <select 
            id="race" 
            bind:value={$formData.race_id}
            on:change={handleChange}
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
          >
            <option value="">Select Race</option>
            {#each $raceOptions as option}
              <option value={option.id}>{option.race}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <div class="sm:col-span-2">
        <label for="pronouns" class="block text-sm font-medium text-gray-700">Pronouns</label>
        <div class="mt-1">
          <input 
            type="text" 
            id="pronouns" 
            bind:value={$formData.pronouns}
            on:change={handleChange}
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
            placeholder="e.g., she/her, they/them"
          />
        </div>
      </div>
      
      <div class="sm:col-span-2">
        <label for="vanid" class="block text-sm font-medium text-gray-700">VAN ID</label>
        <div class="mt-1">
          <input 
            type="text" 
            id="vanid" 
            bind:value={$formData.vanid}
            on:change={handleChange}
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
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
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            disabled={isSaving}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deceased">Deceased</option>
            <option value="moved">Moved</option>
          </select>
        </div>
      </div>
    </div>
  </div>