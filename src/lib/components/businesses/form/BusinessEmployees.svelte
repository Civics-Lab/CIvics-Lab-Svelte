<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Writable } from 'svelte/store';
  import type { BusinessFormErrors, Employee, ContactOption } from './types';
  import { Plus, X, Users, Search, User } from '@lucide/svelte';
  
  export let employees: Writable<Employee[]>;
  export let errors: Writable<BusinessFormErrors>;
  export let isSubmitting: Writable<boolean>;
  export let contactOptions: Writable<ContactOption[]>;
  export let isLoadingContacts = false;
  
  const dispatch = createEventDispatcher();
  
  // Employee search and selection state
  let employeeInput = '';
  let filteredContacts: ContactOption[] = [];
  let showContactSelect = false;
  let selectedContactId = '';
  
  // Available status options
  const statusOptions = [
    'active',
    'inactive', 
    'fired',
    'suspended'
  ];
  
  function addEmployee(contactId: string, contactName: string) {
    // Check if employee already exists
    if (!$employees.some(e => e.contact_id === contactId)) {
      employees.update(items => [
        ...items, 
        { 
          contact_id: contactId, 
          contact_name: contactName,
          status: 'active',
          isNew: true
        }
      ]);
      
      // Dispatch change event
      dispatch('change');
    }
    
    // Clear input and hide selection
    employeeInput = '';
    selectedContactId = '';
    filteredContacts = [];
    showContactSelect = false;
  }
  
  function removeEmployee(index: number) {
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
    dispatch('change');
  }
  
  function updateEmployeeStatus(index: number, status: string) {
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
    dispatch('change');
  }
  
  function handleEmployeeInputChange() {
    // Dispatch event to search contacts
    if (employeeInput.trim().length > 1) {
      dispatch('searchContacts', employeeInput);
    }
    
    // Filter existing contacts based on input
    if (employeeInput.trim().length > 0) {
      filteredContacts = $contactOptions.filter(contact => 
        contact.name.toLowerCase().includes(employeeInput.toLowerCase())
      );
    } else {
      filteredContacts = $contactOptions;
    }
  }
  
  function selectContact(contact: ContactOption) {
    selectedContactId = contact.id;
    addEmployee(contact.id, contact.name);
  }
  
  function toggleContactSelect() {
    showContactSelect = !showContactSelect;
    if (showContactSelect) {
      employeeInput = '';
      selectedContactId = '';
      contactOptions.update(contacts => []);
    }
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && filteredContacts.length > 0) {
      event.preventDefault();
      selectContact(filteredContacts[0]);
    }
  }
  
  // Watch for input changes
  $: if (employeeInput !== undefined) {
    handleEmployeeInputChange();
  }
  
  // Watch for contact options changes
  $: if ($contactOptions !== undefined) {
    filteredContacts = $contactOptions;
  }
  
  function getStatusBadgeClass(status: string) {
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
      on:click={toggleContactSelect}
      disabled={$isSubmitting}
    >
      <Plus class="h-4 w-4" />
      Add Employee
    </button>
  </div>
  
  {#if showContactSelect}
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
          <div class="relative">
            <input 
              type="text" 
              id="contact_search" 
              bind:value={employeeInput}
              on:input={handleEmployeeInputChange}
              on:keydown={handleKeyDown}
              class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search by name"
              disabled={$isSubmitting}
            />
            
            <!-- Contact suggestions dropdown -->
            {#if filteredContacts.length > 0 && employeeInput.length > 0}
              <div class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {#each filteredContacts as contact}
                  <button
                    type="button"
                    class="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                    on:click={() => selectContact(contact)}
                    tabindex="0"
                  >
                    {contact.name}
                  </button>
                {/each}
              </div>
            {:else if isLoadingContacts}
              <div class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg px-4 py-2">
                <div class="text-sm text-slate-500">Loading contacts...</div>
              </div>
            {:else if employeeInput.length > 1 && filteredContacts.length === 0}
              <div class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg px-4 py-2">
                <div class="text-sm text-slate-500">No contacts found</div>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 h-9 px-3"
            on:click={toggleContactSelect}
            disabled={$isSubmitting}
          >
            Cancel
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
          disabled={$isSubmitting}
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
              <h4 class="text-sm font-medium text-slate-900">{employee.contact_name}</h4>
              <p class="text-sm text-slate-600">Employee</p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {getStatusBadgeClass(employee.status)}">
              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
            </span>
            <select 
              value={employee.status}
              on:change={(e) => updateEmployeeStatus(i, e.target.value)}
              class="flex h-8 items-center justify-between rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={$isSubmitting}
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
          on:click={toggleContactSelect}
          disabled={$isSubmitting}
        >
          <Plus class="h-4 w-4" />
          Add First Employee
        </button>
      </div>
    {/if}
  </div>
</div>
