<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { BusinessFormErrors, Employee, ContactOption } from './types';
  
  export let employees: Writable<Employee[]>;
  export let errors: Writable<BusinessFormErrors>;
  export let isSubmitting: Writable<boolean>;
  export let contactOptions: Writable<ContactOption[]>;
  
  // Employee search field state
  let employeeInput = '';
  let filteredContacts: ContactOption[] = [];
  
  function addEmployee(contactId: string, contactName: string) {
    // Check if employee already exists
    if (!$employees.some(e => e.contact_id === contactId)) {
      employees.update(items => [
        ...items, 
        { 
          contact_id: contactId, 
          contact_name: contactName,
          status: 'active' 
        }
      ]);
    }
    
    // Clear input after adding
    employeeInput = '';
    filteredContacts = [];
  }
  
  function removeEmployee(index: number) {
    employees.update(items => items.filter((_, i) => i !== index));
  }
  
  function handleEmployeeInputChange() {
    // Filter contacts based on input
    if (employeeInput.trim()) {
      filteredContacts = $contactOptions
        .filter(contact => 
          contact.name.toLowerCase().includes(employeeInput.toLowerCase()) && 
          !$employees.some(e => e.contact_id === contact.id)
        )
        .slice(0, 5);
    } else {
      filteredContacts = [];
    }
  }
  
  function selectContact(contact: ContactOption) {
    addEmployee(contact.id, contact.name);
  }
  
  // Watch for input changes
  $: if (employeeInput !== undefined) {
    handleEmployeeInputChange();
  }
</script>

<div class="mt-8">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-medium text-gray-900">Employees</h2>
  </div>
  
  <!-- Employee autocomplete search field -->
  <div class="mb-4">
    <label for="employee_search" class="block text-sm font-medium text-gray-700">Add Employee</label>
    <div class="mt-1 flex-grow mr-2 relative">
      <input
        type="text"
        id="employee_search"
        placeholder="Search contacts..."
        bind:value={employeeInput}
        class="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
        disabled={$isSubmitting}
        on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), filteredContacts.length > 0 && selectContact(filteredContacts[0]))}
        aria-label="Search for employee"
      />
      
      <!-- Contact suggestions dropdown -->
      {#if filteredContacts.length > 0}
        <div class="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {#each filteredContacts as contact}
            <button
              type="button"
              class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              on:click={() => selectContact(contact)}
              aria-label="Select contact {contact.name}"
            >
              {contact.name}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Employees list -->
  {#if $employees.length > 0}
    <div class="mt-4">
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200" role="list">
          {#each $employees as employee, i}
            <li class="px-4 py-4 sm:px-6 flex justify-between items-center">
              <div class="flex items-center">
                <div class="text-sm font-medium text-gray-900">
                  {employee.contact_name}
                </div>
                <div class="ml-2 text-sm text-gray-500">
                  <select
                    bind:value={employee.status}
                    class="shadow-sm focus:ring-green-500 focus:border-green-500 block sm:text-sm border-gray-300 rounded-md"
                    disabled={$isSubmitting}
                    aria-label="Employee status"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="fired">Fired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                class="text-red-600 hover:text-red-900"
                on:click={() => removeEmployee(i)}
                disabled={$isSubmitting}
                aria-label="Remove employee"
              >
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {:else}
    <div class="text-sm text-gray-500 italic">
      No employees added yet.
    </div>
  {/if}
</div>
