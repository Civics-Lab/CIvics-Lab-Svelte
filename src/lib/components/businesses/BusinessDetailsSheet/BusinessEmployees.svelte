<!-- src/lib/components/businesses/BusinessDetailsSheet/BusinessEmployees.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { writable } from 'svelte/store';
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
      isAddingEmployee.set(true);
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
  </script>
  
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium text-gray-900">Employees</h2>
      <button
        type="button"
        class="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
        on:click={addEmployee}
        disabled={isSaving || $isAddingEmployee}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Employee
      </button>
    </div>
    
    {#if $showContactSelect}
      <div class="border rounded-md p-4 mb-4 bg-gray-50">
        <h3 class="text-sm font-medium text-gray-900 mb-3">Add Employee</h3>
        
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="contact_search" class="block text-sm font-medium text-gray-700 mb-1">Search Contact</label>
            <div class="flex items-center">
              <input 
                type="text" 
                id="contact_search" 
                bind:value={$searchQuery}
                on:input={() => {
                  if ($searchQuery.trim().length > 1) {
                    handleContactSearch();
                  }
                }}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
                placeholder="Search by name"
                disabled={$isAddingEmployee}
              />
              <button
                type="button"
                class="ml-2 p-2 rounded-md bg-green-100 text-green-600 hover:bg-green-200"
                on:click={() => {
                  if ($searchQuery.trim().length > 1) {
                    handleContactSearch();
                  }
                }}
                disabled={$isAddingEmployee || $searchQuery.trim().length <= 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div>
            <label for="contact" class="block text-sm font-medium text-gray-700 mb-1">Select Contact</label>
            <select 
              id="contact"
              bind:value={$selectedContactId}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
          
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input 
              type="text" 
              id="role" 
              bind:value={$selectedRole}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" 
              placeholder="Job title or role"
              disabled={$isAddingEmployee}
            />
          </div>
        </div>
        
        <div class="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            class="px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            on:click={toggleContactSelect}
            disabled={$isAddingEmployee}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            on:click={confirmAddEmployee}
            disabled={$isAddingEmployee || !$selectedContactId || !$selectedRole}
          >
            {#if $isAddingEmployee}
              <LoadingSpinner size="sm" color="white" />
            {:else}
              Add Employee
            {/if}
          </button>
        </div>
      </div>
    {/if}
    
    {#each $employees.filter(item => !item.isDeleted) as employee, i}
      <div class="border rounded-md p-4 mb-4 bg-gray-50 relative">
        <button 
          type="button" 
          class="absolute top-2 right-2 text-gray-400 hover:text-red-600" 
          on:click={() => removeEmployee(i)}
          disabled={isSaving}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div class="flex flex-col sm:flex-row justify-between">
          <div class="mb-3 sm:mb-0">
            <h4 class="text-sm font-medium text-gray-900">{formatName(employee)}</h4>
            <p class="text-sm text-gray-500">{employee.role || ''}</p>
          </div>
          
          <div>
            <label for="employee_status_{i}" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              id="employee_status_{i}" 
              value={employee.status}
              on:change={(e) => updateEmployeeStatus(i, e.target.value)}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
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
      <div class="border border-dashed rounded-md p-6 text-center text-gray-500">
        <p>No employees added yet.</p>
        <button
          type="button"
          class="mt-2 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800"
          on:click={addEmployee}
          disabled={isSaving}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </button>
      </div>
    {/if}
  </div>