<!-- src/lib/components/contacts/ContactsDataGrid.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import ContactDetailsSheet from '$lib/components/contacts/ContactDetailsSheet.svelte';
  import Pagination from '$lib/components/shared/pagination/Pagination.svelte';
  
  // Props
  export let contacts = [];
  export let isLoading = false;
  export let error = null;
  export let visibleColumns = [];
  export let availableFields = [];
  
  // Pagination props
  export let currentPage = 1;
  export let totalPages = 1;
  export let totalRecords = 0;
  export let pageSize = 250;
  export let pageSizeOptions = [50, 100, 250, 500, 1000];
  
  // State
  let columnRefs = {};
  let startX = 0;
  let startWidth = 0;
  let currentColumn = null;
  
  // Contact details sheet state
  const isContactDetailsOpen = writable(false);
  const selectedContactId = writable<string | null>(null);
  
  const dispatch = createEventDispatcher<{
    addContact: void;
    contactUpdated: void;
    pageChanged: { page: number };
    pageSizeChanged: { pageSize: number };
  }>();
  
  // Methods
  function startResize(e, columnId) {
    startX = e.clientX;
    currentColumn = columnId;
    const column = columnRefs[columnId];
    if (column) {
      startWidth = column.offsetWidth;
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    }
    e.preventDefault();
  }
  
  function resize(e) {
    if (!currentColumn) return;
    const column = columnRefs[currentColumn];
    if (column) {
      const width = startWidth + (e.clientX - startX);
      if (width >= 50) { // Minimum width of 50px
        column.style.width = `${width}px`;
        column.style.minWidth = `${width}px`;
      }
    }
  }
  
  function stopResize() {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
    currentColumn = null;
  }
  
  function getFieldLabel(columnId) {
    const field = availableFields.find(f => f.id === columnId);
    return field ? field.label : columnId;
  }
  
  // Computed paginated contacts - only for client-side pagination
  // For server-side pagination, use contacts directly as they're already paginated
  $: paginatedContacts = (() => {
    // Check if we need client-side pagination based on totalRecords
    // If totalRecords equals contacts.length, we're likely in client-side mode
    if (totalRecords === contacts.length) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return contacts.slice(startIndex, endIndex);
    }
    // For server-side pagination, contacts are already paginated
    return contacts;
  })();
  
  function viewContact(contact, e) {
    // Prevent the event from bubbling up to the tr click handler
    if (e) e.stopPropagation();
    
    selectedContactId.set(contact.id);
    isContactDetailsOpen.set(true);
  }
  
  function addContact() {
    dispatch('addContact');
  }
  
  function handleContactUpdated() {
    dispatch('contactUpdated');
  }

  function handlePageChanged(event) {
    dispatch('pageChanged', { page: event.detail.page });
  }

  function handlePageSizeChanged(event) {
    dispatch('pageSizeChanged', { pageSize: event.detail.pageSize });
  }
  
  function closeContactDetails() {
    isContactDetailsOpen.set(false);
    selectedContactId.set(null);
  }
  
  onMount(() => {
    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
  });
</script>

<div class="flex-1 overflow-auto relative px-6">
  <div class="bg-white rounded-lg shadow overflow-hidden">
    {#if isLoading}
      <div class="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    {:else if error}
      <div class="text-center text-red-500 py-20">
        {error}
      </div>
    {:else if contacts.length === 0}
      <div class="text-center py-20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p class="text-gray-500 text-lg">No contacts found</p>
        <p class="text-gray-400 mt-1">Add your first contact or adjust your filters</p>
        <button
          on:click={addContact}
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Add a Contact
        </button>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              {#each visibleColumns as columnId}
                <th 
                  scope="col" 
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                  bind:this={columnRefs[columnId]}
                >
                  {getFieldLabel(columnId)}
                  <!-- Column resize handle -->
                  <div 
                    class="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center group"
                    on:mousedown={(e) => startResize(e, columnId)}
                  >
                    <div class="h-full w-px bg-gray-300 group-hover:bg-blue-500 group-hover:w-0.5"></div>
                  </div>
                </th>
              {/each}
              <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each paginatedContacts as contact (contact.id)}
              <tr 
                class="hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                on:click={() => viewContact(contact)}
                aria-label="Click to view contact details"
              >
                {#each visibleColumns as columnId}
                  <td class="px-4 py-4 whitespace-nowrap">
                    {#if columnId === 'firstName' || columnId === 'middleName' || columnId === 'lastName'}
                      <div class="text-sm font-medium text-gray-900">
                        {contact[columnId] || '—'}
                      </div>
                    {:else if columnId === 'emails' || columnId === 'phoneNumbers' || columnId === 'addresses' || columnId === 'socialMediaAccounts'}
                      <!-- Show multiple items with badges -->
                      <div class="flex flex-wrap gap-1">
                        {#if contact[columnId] && Array.isArray(contact[columnId]) && contact[columnId].length > 0}
                          {#each contact[columnId].slice(0, 2) as item}
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {item.email || item.phoneNumber || item.streetAddress || item.socialMediaAccount || '—'}
                            </span>
                          {/each}
                          {#if contact[columnId].length > 2}
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{contact[columnId].length - 2} more
                            </span>
                          {/if}
                        {:else}
                          <span class="text-sm text-gray-500">—</span>
                        {/if}
                      </div>
                    {:else}
                      <div class="text-sm text-gray-500">
                        {contact[columnId] || '—'}
                      </div>
                    {/if}
                  </td>
                {/each}
                <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    class="text-blue-600 hover:text-blue-900"
                    on:click={(e) => viewContact(contact, e)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
  
  <!-- Pagination -->
  {#if totalRecords > 0}
    <Pagination
      {currentPage}
      {totalPages}
      {totalRecords}
      {pageSize}
      {pageSizeOptions}
      {isLoading}
      on:pageChanged={handlePageChanged}
      on:pageSizeChanged={handlePageSizeChanged}
    />
  {/if}
</div>

<!-- Contact Details Sheet -->
{#if $isContactDetailsOpen}
  <ContactDetailsSheet 
    isOpen={$isContactDetailsOpen}
    contactId={$selectedContactId}
    on:close={closeContactDetails}
    on:updated={handleContactUpdated}
  />
{/if}
