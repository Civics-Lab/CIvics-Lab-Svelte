<!-- src/lib/components/donations/DonorSelector.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { Search, User, Building, X, ChevronDown } from '@lucide/svelte';
  
  export let currentDonor = null; // { type: 'contact'|'business', id: string, name: string }
  export let isOpen = false;
  export let disabled = false;
  
  const dispatch = createEventDispatcher();
  
  // State
  const donorType = writable('contact'); // 'contact' or 'business'
  const searchQuery = writable('');
  const searchResults = writable([]);
  const isSearching = writable(false);
  const searchError = writable(null);
  const showDropdown = writable(false);
  
  let searchTimeout;
  let dropdownRef;
  let searchInputRef;
  
  // Debounced search function
  async function performSearch(query, type) {
    if (!query || query.length < 2) {
      searchResults.set([]);
      return;
    }
    
    if (!$workspaceStore.currentWorkspace) {
      searchError.set('No workspace selected');
      return;
    }
    
    isSearching.set(true);
    searchError.set(null);
    
    try {
      const endpoint = type === 'contact' ? '/api/contacts' : '/api/businesses';
      const response = await fetch(`${endpoint}?workspace_id=${$workspaceStore.currentWorkspace.id}&search=${encodeURIComponent(query)}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search');
      }
      
      const data = await response.json();
      const results = type === 'contact' ? data.contacts : data.businesses;
      
      searchResults.set(results || []);
    } catch (error) {
      console.error('Search error:', error);
      searchError.set('Failed to search');
      searchResults.set([]);
    } finally {
      isSearching.set(false);
    }
  }
  
  // Handle search input with debouncing
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    const query = $searchQuery.trim();
    
    if (query.length === 0) {
      searchResults.set([]);
      showDropdown.set(false);
      return;
    }
    
    showDropdown.set(true);
    
    if (query.length < 2) {
      searchResults.set([]);
      return;
    }
    
    searchTimeout = setTimeout(() => {
      performSearch(query, $donorType);
    }, 300);
  }
  
  // Handle donor type change
  function handleDonorTypeChange(newType) {
    donorType.set(newType);
    searchQuery.set('');
    searchResults.set([]);
    showDropdown.set(false);
    
    if (searchInputRef) {
      searchInputRef.focus();
    }
  }
  
  // Handle selecting a donor from search results
  function selectDonor(donor) {
    const selectedDonor = {
      type: $donorType,
      id: donor.id,
      name: $donorType === 'contact' 
        ? `${donor.firstName} ${donor.lastName}`.trim()
        : donor.businessName || donor.business_name
    };
    
    // Update search query to show selected name
    searchQuery.set(selectedDonor.name);
    showDropdown.set(false);
    searchResults.set([]);
    
    // Dispatch selection
    dispatch('select', selectedDonor);
  }
  
  // Clear selection
  function clearSelection() {
    searchQuery.set('');
    searchResults.set([]);
    showDropdown.set(false);
    dispatch('select', null);
  }
  
  // Handle clicking outside to close dropdown
  function handleClickOutside(event) {
    if (dropdownRef && !dropdownRef.contains(event.target)) {
      showDropdown.set(false);
    }
  }
  
  // Handle focus on search input
  function handleSearchFocus() {
    if ($searchQuery.length >= 2) {
      showDropdown.set(true);
    }
  }
  
  // Handle escape key
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      showDropdown.set(false);
    }
  }
  
  // Initialize donor type based on current donor
  onMount(() => {
    if (currentDonor) {
      donorType.set(currentDonor.type);
      searchQuery.set(currentDonor.name);
    }
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      clearTimeout(searchTimeout);
    };
  });
  
  // Watch for changes in search query
  $: if ($searchQuery !== undefined) {
    handleSearchInput();
  }
  
  // Update when currentDonor prop changes
  $: if (currentDonor) {
    donorType.set(currentDonor.type);
    searchQuery.set(currentDonor.name);
  } else if (currentDonor === null) {
    searchQuery.set('');
  }
</script>

<div class="space-y-3" bind:this={dropdownRef}>
  <!-- Donor Type Selector -->
  <div class="flex items-center gap-3">
    <span class="text-sm font-medium text-slate-700">Donor Type:</span>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors {$donorType === 'contact' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}"
        on:click={() => handleDonorTypeChange('contact')}
        {disabled}
      >
        <User class="h-4 w-4" />
        Contact
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors {$donorType === 'business' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}"
        on:click={() => handleDonorTypeChange('business')}
        {disabled}
      >
        <Building class="h-4 w-4" />
        Business
      </button>
    </div>
  </div>
  
  <!-- Search Input -->
  <div class="relative">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {#if $isSearching}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
        {:else}
          <Search class="h-4 w-4 text-slate-400" />
        {/if}
      </div>
      <input
        bind:this={searchInputRef}
        type="text"
        class="flex h-9 w-full rounded-md border border-slate-300 bg-white pl-10 pr-10 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Search for a {$donorType === 'contact' ? 'contact' : 'business'}..."
        bind:value={$searchQuery}
        on:focus={handleSearchFocus}
        on:keydown={handleKeydown}
        {disabled}
      />
      {#if $searchQuery}
        <button
          type="button"
          class="absolute inset-y-0 right-0 pr-3 flex items-center"
          on:click={clearSelection}
          {disabled}
        >
          <X class="h-4 w-4 text-slate-400 hover:text-slate-600" />
        </button>
      {/if}
    </div>
    
    <!-- Search Results Dropdown -->
    {#if $showDropdown && !disabled}
      <div class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-slate-200 max-h-60 overflow-auto">
        {#if $searchError}
          <div class="p-3 text-sm text-red-600">
            {$searchError}
          </div>
        {:else if $searchQuery.length < 2}
          <div class="p-3 text-sm text-slate-500">
            Type at least 2 characters to search...
          </div>
        {:else if $isSearching}
          <div class="p-3 text-sm text-slate-500 flex items-center gap-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
            Searching...
          </div>
        {:else if $searchResults.length === 0}
          <div class="p-3 text-sm text-slate-500">
            No {$donorType === 'contact' ? 'contacts' : 'businesses'} found
          </div>
        {:else}
          {#each $searchResults as result}
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none flex items-center gap-3"
              on:click={() => selectDonor(result)}
            >
              {#if $donorType === 'contact'}
                <User class="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-slate-900">
                    {result.firstName} {result.lastName}
                  </div>
                  {#if result.emails && result.emails.length > 0}
                    <div class="text-slate-500 text-xs truncate">
                      {result.emails[0].email}
                    </div>
                  {/if}
                </div>
              {:else}
                <Building class="h-4 w-4 text-green-600 flex-shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-slate-900">
                    {result.businessName || result.business_name}
                  </div>
                  {#if result.addresses && result.addresses.length > 0}
                    <div class="text-slate-500 text-xs truncate">
                      {result.addresses[0].city}
                    </div>
                  {/if}
                </div>
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Current Selection Display -->
  {#if currentDonor && $searchQuery}
    <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-md border">
      {#if currentDonor.type === 'contact'}
        <User class="h-4 w-4 text-blue-600" />
        <span class="text-sm text-slate-700">Contact:</span>
      {:else}
        <Building class="h-4 w-4 text-green-600" />
        <span class="text-sm text-slate-700">Business:</span>
      {/if}
      <span class="text-sm font-medium text-slate-900">{currentDonor.name}</span>
    </div>
  {/if}
</div>