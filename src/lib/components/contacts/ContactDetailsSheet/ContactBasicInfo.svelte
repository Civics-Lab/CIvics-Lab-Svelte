<!-- src/lib/components/contacts/ContactDetailsSheet/ContactBasicInfo.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { User } from '@lucide/svelte';
  
  // Props
  export let formData;
  export let genderOptions;
  export let raceOptions;
  export let isSaving = false;
  
  const dispatch = createEventDispatcher();
  
  function handleChange() {
    dispatch('change');
  }
  
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'deceased':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
</script>

<div class="space-y-6">
  <div class="border-b border-slate-200 pb-4">
    <h3 class="text-lg font-semibold leading-6 text-slate-900">Contact Information</h3>
    <p class="mt-1 text-sm text-slate-600">Update the contact's personal details and demographic information.</p>
  </div>
  
  <div class="space-y-6">
    <!-- Name Fields -->
    <div class="grid gap-4 md:grid-cols-3">
      <div class="space-y-2">
        <label for="first_name" class="block text-sm font-medium text-slate-700">
          First Name <span class="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          id="first_name" 
          bind:value={$formData.first_name}
          on:change={handleChange}
          class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          placeholder="First name"
          required
        />
      </div>
      
      <div class="space-y-2">
        <label for="middle_name" class="block text-sm font-medium text-slate-700">Middle Name</label>
        <input 
          type="text" 
          id="middle_name" 
          bind:value={$formData.middle_name}
          on:change={handleChange}
          class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          placeholder="Middle name"
        />
      </div>
      
      <div class="space-y-2">
        <label for="last_name" class="block text-sm font-medium text-slate-700">
          Last Name <span class="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          id="last_name" 
          bind:value={$formData.last_name}
          on:change={handleChange}
          class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          placeholder="Last name"
          required
        />
      </div>
    </div>
    
    <!-- Demographics Row -->
    <div class="grid gap-4 md:grid-cols-3">
      <div class="space-y-2">
        <label for="gender" class="block text-sm font-medium text-slate-700">
          Gender
        </label>
        <select 
          id="gender" 
          bind:value={$formData.gender_id}
          on:change={handleChange}
          class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
        >
          <option value="">Select Gender</option>
          {#each $genderOptions as option}
            <option value={option.id}>{option.gender}</option>
          {/each}
        </select>
      </div>
      
      <div class="space-y-2">
        <label for="race" class="block text-sm font-medium text-slate-700">Race</label>
        <select 
          id="race" 
          bind:value={$formData.race_id}
          on:change={handleChange}
          class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
        >
          <option value="">Select Race</option>
          {#each $raceOptions as option}
            <option value={option.id}>{option.race}</option>
          {/each}
        </select>
      </div>
      
      <div class="space-y-2">
        <label for="pronouns" class="block text-sm font-medium text-slate-700">Pronouns</label>
        <input 
          type="text" 
          id="pronouns" 
          bind:value={$formData.pronouns}
          on:change={handleChange}
          class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          placeholder="e.g., she/her, they/them"
        />
      </div>
    </div>
    
    <!-- VAN ID and Status Row -->
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <label for="vanid" class="block text-sm font-medium text-slate-700">
          VAN ID
        </label>
        <input 
          type="text" 
          id="vanid" 
          bind:value={$formData.vanid}
          on:change={handleChange}
          class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          placeholder="Voter file ID"
        />
      </div>
      
      <div class="space-y-2">
        <label for="status" class="block text-sm font-medium text-slate-700">Status</label>
        <select 
          id="status" 
          bind:value={$formData.status}
          on:change={handleChange}
          class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deceased">Deceased</option>
          <option value="moved">Moved</option>
        </select>
      </div>
    </div>
    
    <!-- Status Badge Display -->
    {#if $formData.status}
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-600">Current Status:</span>
        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusBadgeClass($formData.status)}">
          {$formData.status.charAt(0).toUpperCase() + $formData.status.slice(1)}
        </span>
      </div>
    {/if}
  </div>
</div>