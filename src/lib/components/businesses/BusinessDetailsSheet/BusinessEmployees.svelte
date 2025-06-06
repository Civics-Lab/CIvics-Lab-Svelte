<!-- src/lib/components/businesses/BusinessDetailsSheet/BusinessEmployees.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { Plus, X, Users, Search, User, Briefcase } from '@lucide/svelte';
  import type { TypedSupabaseClient } from '$lib/types/supabase';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  
  // Props
  export let employees;
  export let contactOptions;
  export let supabase: TypedSupabaseClient;
  export let isSaving = false;
  export let isLoadingContacts = false;
  
  const dispatch = createEventDispatcher();
  
  // For employee selection
  const selectedContactId = writable('');
  const selectedRole = writable(''); 
  const isAddingEmployee = writable(false);
  const showContactSelect = writable(false);
  const searchQuery = writable('');
  
  // For searching contacts via API
  function handleContactSearch() {
    if ($searchQuery && $searchQuery.trim().length > 1) {
      dispatch('searchContacts', $searchQuery);
    }
  }
  
  // Available status options
  const statusOptions = [
    'active',
    'inactive',
    'fired',
    'suspended'
  ];
  
  function handleChange() {
    dispatch('change');
  }
  
  function toggleContactSelect() {
    showContactSelect.update(value => !value);
    // Reset search query when showing the select
    if ($showContactSelect) {
      searchQuery.set('');
      // Clear existing contact options when opening
      contactOptions.set([]);
    }
  }
  
  function addEmployee() {
    // Reset selection
    selectedContactId.set('');
    selectedRole.set('');
    isAddingEmployee.set(false);
    toggleContactSelect();
  }
  
  async function confirmAddEmployee() {
    if (!$selectedContactId || !$selectedRole) return;
    
    isAddingEmployee.set(true);
    
    try {
      // Find the selected contact
      const contact = $contactOptions.find(c => c.id === $selectedContactId);
      
      // Add to employees list
      employees.update(items => [
        ...items, 
        {
          id: `temp-${Date.now()}`, // Will be replaced by the real ID after saving
          business_id: null, // This will be set when saving
          contact_id: $selectedContactId,
          status: 'active',
          role: $selectedRole, // Store role information for display
          isNew: true,
          contact_name: contact ? contact.name : 'Unknown Contact'
        }
      ]);
      
      // Close the selection UI
      showContactSelect.set(false);
      isAddingEmployee.set(false);
      
      // Log for debugging
      console.log('Added new employee with role:', $selectedRole);
      
      // Reset role and contact selection
      selectedRole.set('');
      selectedContactId.set('');
      
      // Dispatch change
      handleChange();
    } catch (err) {
      console.error('Error adding employee:', err);
    } finally {
      isAddingEmployee.set(false);
    }
  }
  
  function removeEmployee(index) {
    employees.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      if (item.id && !item.id.startsWith('temp-')) {
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
  
  function updateEmployeeStatus(index, status) {
    employees.update(items => {
      const updatedItems = [...items];
      const item = updatedItems[index];
      
      if (item.id && !item.id.startsWith('temp-') && !item.isNew) {
        // Mark as modified for existing items
        item.isModified = true;
      }
      
      item.status = status;
      return updatedItems;
    });
    handleChange();
  }
  
  // Format display name
  function formatName(employee) {
    return employee.contactName || employee.contact_name || 'Unknown Contact';
  }
  
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'fired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between border-b border-slate-200 pb-4">
    <div>
      <h3 class="text-lg font-semibold leading-6 text-slate-900">Employees</h3>
      <p class="mt-1 text-sm text-slate-600">Manage business employees and their contact information.</p>
    </div>
    <button
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 h-9 px-3"
      on:click={addEmployee}
      disabled={isSaving || $isAddingEmployee}
    >
      <Plus class="h-4 w-4" />
      Add Employee
    </button>
  </div>
  
  {#if $showContactSelect}
    <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 class="text-sm font-medium text-slate-900 mb-4 flex items-center gap-2">
        <User class="h-4 w-4" />
        Add Employee
      </h3>
      
      <div class="space-y-4">
        <!-- Contact Search -->
        <div class="space-y-2">
          <label for="contact_search" class="block text-sm font-medium text-slate-700">
            <Search class="inline h-4 w-4 mr-1" />
            Search Contact
          </label>
          <div class="flex items-center gap-2">
            <input 
              type="text" 
              id="contact_search" 
              bind:value={$searchQuery}
              on:input={() => {
                if ($searchQuery.trim().length > 1) {
                  handleContactSearch();
                }
              }}
              class="flex h-9 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search by name"
              disabled={$isAddingEmployee}
            />
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              on:click={() => {
                if ($searchQuery.trim().length > 1) {
                  handleContactSearch();
                }
              }}
              disabled={$isAddingEmployee || $searchQuery.trim().length <= 1}
            >
              <Search class="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <!-- Contact Selection -->
        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label for="contact" class="block text-sm font-medium text-slate-700">Select Contact</label>
            <select 
              id="contact"
              bind:value={$selectedContactId}
              class="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={$isLoadingContacts || $isAddingEmployee}
            >
              <option value="">Select a contact</option>
              {#if $isLoadingContacts}
                <option value="" disabled>Loading contacts...</option>
              {:else if $contactOptions.length === 0 && $searchQuery.trim().length > 1}
                <option value="" disabled>No contacts found</option>
              {:else if $contactOptions.length === 0}
                <option value="" disabled>Search for contacts above</option>
              {:else}
                {#each $contactOptions as contact}
                  <option value={contact.id}>{contact.name}</option>
                {/each}
              {/if}
            </select>
          </div>
          
          <div class="space-y-2">
            <label for="role" class="block text-sm font-medium text-slate-700">
              <Briefcase class="inline h-4 w-4 mr-1" />
              Role
            </label>
            <input 
              type="text" 
              id="role" 
              bind:value={$selectedRole}
              class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Job title or role"
              disabled={$isAddingEmployee}
            />
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 h-9 px-3"
            on:click={toggleContactSelect}
            disabled={$isAddingEmployee}
          >
            Cancel
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-9 px-3"
            on:click={confirmAddEmployee}
            disabled={$isAddingEmployee || !$selectedContactId || !$selectedRole}
          >
            {#if $isAddingEmployee}
              <LoadingSpinner size="sm" color="white" />
              Adding...
            {:else}
              <Plus class="h-4 w-4" />
              Add Employee
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <div class="space-y-4">
    {#each $employees.filter(item => !item.isDeleted) as employee, i}
      <div class="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button 
          type="button" 
          class="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors" 
          on:click={() => removeEmployee(i)}
          disabled={isSaving}
        >
          <X class="h-4 w-4" />
          <span class="sr-only">Remove employee</span>
        </button>
        
        <div class="flex flex-col gap-4 pr-8 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <User class="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-slate-900">{formatName(employee)}</h4>
              <p class="text-sm text-slate-600 flex items-center gap-1">
                <Briefcase class="h-3 w-3" />
                {employee.role || 'No role specified'}
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusBadgeClass(employee.status)}">
              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
            </span>
            <select 
              id="employee_status_{i}" 
              value={employee.status}
              on:change={(e) => updateEmployeeStatus(i, e.target.value)}
              class="flex h-8 items-center justify-between rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            >
              {#each statusOptions as status}
                <option value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>
    {/each}
    
    {#if $employees.filter(item => !item.isDeleted).length === 0}
      <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Users class="h-8 w-8 text-slate-400 mb-3" />
        <h3 class="text-sm font-medium text-slate-900 mb-1">No employees added</h3>
        <p class="text-sm text-slate-600 mb-4">Connect employees to this business for better organization.</p>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-white hover:bg-slate-800 h-9 px-3"
          on:click={addEmployee}
          disabled={isSaving}
        >
          <Plus class="h-4 w-4" />
          Add First Employee
        </button>
      </div>
    {/if}
  </div>
</div>