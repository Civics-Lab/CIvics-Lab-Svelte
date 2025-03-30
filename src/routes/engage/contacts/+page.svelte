<!-- src/routes/engage/contacts/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { PageData } from './$types';
  
  // Import components
  import ContactsViewNavbar from '$lib/components/contacts/ContactsViewNavbar.svelte';
  import ContactsFilterSortBar from '$lib/components/contacts/ContactsFilterSortBar.svelte';
  import ContactsDataGrid from '$lib/components/contacts/ContactsDataGrid.svelte';
  import ContactsViewModals from '$lib/components/contacts/ContactsViewModals.svelte';
  
  export let data: PageData;
  
  // State for modals
  const isContactModalOpen = writable(false);
  const isCreateViewModalOpen = writable(false);
  const isEditViewModalOpen = writable(false);
  const isDeleteViewModalOpen = writable(false);
  
  // State for view settings popover
  const isViewSettingsOpen = writable(false);
  const isViewSelectOpen = writable(false);
  const isFilterPopoverOpen = writable(false);
  const isSortPopoverOpen = writable(false);
  
  // View management
  const views = writable<any[]>([]);
  // Use browser localStorage to persist the current view
  const createPersistentViewStore = () => {
    const storedViewId = typeof window !== 'undefined' 
      ? localStorage.getItem('currentContactViewId') 
      : null;
    
    const { subscribe, set, update } = writable<any | null>(null);
    
    return {
      subscribe,
      set: (view) => {
        // Store the view ID in localStorage when set
        if (view && view.id && typeof window !== 'undefined') {
          localStorage.setItem('currentContactViewId', view.id);
        }
        set(view);
      },
      update
    };
  };
  
  const currentView = createPersistentViewStore();
  const newViewName = writable('');
  const viewsLoading = writable(false);
  const viewsError = writable<string | null>(null);
  
  // Fields that can be displayed/filtered/sorted
  const availableFields = writable([
    { id: 'first_name', label: 'First Name' },
    { id: 'last_name', label: 'Last Name' },
    { id: 'middle_name', label: 'Middle Name' },
    { id: 'gender', label: 'Gender' },
    { id: 'race', label: 'Race' },
    { id: 'pronouns', label: 'Pronouns' },
    { id: 'emails', label: 'Email' },
    { id: 'phone_numbers', label: 'Phone' },
    { id: 'addresses', label: 'Address' },
    { id: 'social_media_accounts', label: 'Social Media' },
    { id: 'vanid', label: 'VAN ID' },
  ]);
  
  // Filters state
  const filters = writable<any[]>([]);
  
  // Sort state
  const sorting = writable<any[]>([]);
  
  // Search state
  const searchQuery = writable('');
  
  // Contacts data
  const contacts = writable<any[]>([]);
  const filteredContacts = writable<any[]>([]);
  const isLoadingContacts = writable(false);
  const contactsError = writable<string | null>(null);
  
  // View event handlers
  function handleSelectView(event) {
    const view = event.detail;
    currentView.set(view);
    filters.set(view.filters || []);
    sorting.set(view.sorting || []);
    // Re-apply filters and sorting when view changes
    applyFiltersAndSorting();
  }
  
  function handleToggleField(event) {
    toggleField(event.detail);
  }
  
  function handleOpenCreateViewModal() {
    newViewName.set('');
    isCreateViewModalOpen.set(true);
  }
  
  function handleOpenEditViewModal() {
    if ($currentView) {
      newViewName.set($currentView.view_name);
      isEditViewModalOpen.set(true);
    }
  }
  
  function handleOpenDeleteViewModal() {
    isDeleteViewModalOpen.set(true);
  }
  
  function handleOpenContactModal() {
    isContactModalOpen.set(true);
  }
  
  function handleCloseContactModal() {
    isContactModalOpen.set(false);
  }
  
  function handleContactCreated() {
    fetchContacts();
  }
  
  function handleContactUpdated() {
    fetchContacts();
  }
  
  function handleAddFilter() {
    addFilter();
  }
  
  function handleRemoveFilter(event) {
    removeFilter(event.detail);
  }
  
  function handleMoveFilter(event) {
    const { index, direction } = event.detail;
    moveFilter(index, direction);
  }
  
  function handleAddSort() {
    addSort();
  }
  
  function handleRemoveSort(event) {
    removeSort(event.detail);
  }
  
  function handleMoveSort(event) {
    const { index, direction } = event.detail;
    moveSort(index, direction);
  }
  
  function handleFilterChanged() {
    updateView();
    applyFiltersAndSorting();
  }
  
  function handleSortChanged() {
    updateView();
    applyFiltersAndSorting();
  }
  
  function handleSearchChanged(event) {
    // Update the searchQuery store with the value from the event
    if (event && event.detail !== undefined) {
      searchQuery.set(event.detail);
    }
    applyFiltersAndSorting();
  }
  
  function handleAddContact() {
    isContactModalOpen.set(true);
  }
  
  // Fetch views for the current workspace
  async function fetchViews(selectViewId = null) {
    if (!$workspaceStore.currentWorkspace) return;
    
    viewsLoading.set(true);
    viewsError.set(null);
    
    try {
      const { data: fetchedViews, error } = await data.supabase
        .from('contact_views')
        .select('*')
        .eq('workspace_id', $workspaceStore.currentWorkspace.id)
        .order('view_name');
      
      if (error) throw error;
      
      if (fetchedViews && fetchedViews.length > 0) {
        views.set(fetchedViews);
        
        // If a specific view ID is provided, select that view
        if (selectViewId) {
          const viewToSelect = fetchedViews.find(view => view.id === selectViewId);
          if (viewToSelect) {
            currentView.set(viewToSelect);
            filters.set(viewToSelect.filters || []);
            sorting.set(viewToSelect.sorting || []);
            return;
          }
        }
        
        // Try to restore the previously selected view from localStorage
        const storedViewId = typeof window !== 'undefined' 
          ? localStorage.getItem('currentContactViewId') 
          : null;
        
        if (storedViewId) {
          // Find the view with the stored ID
          const savedView = fetchedViews.find(view => view.id === storedViewId);
          if (savedView) {
            currentView.set(savedView);
            filters.set(savedView.filters || []);
            sorting.set(savedView.sorting || []);
          } else {
            // If stored view is not found, use the first one
            currentView.set(fetchedViews[0]);
            filters.set(fetchedViews[0].filters || []);
            sorting.set(fetchedViews[0].sorting || []);
          }
        } else {
          // If no stored view, use the first one
          currentView.set(fetchedViews[0]);
          filters.set(fetchedViews[0].filters || []);
          sorting.set(fetchedViews[0].sorting || []);
        }
      } else {
        // Create a default view if none exists
        await createDefaultView();
      }
    } catch (error) {
      console.error('Error fetching views:', error);
      viewsError.set('Failed to load views');
    } finally {
      viewsLoading.set(false);
    }
  }
  
  // Create a default view if none exists
  async function createDefaultView() {
    if (!$workspaceStore.currentWorkspace) return;
    
    try {
      const defaultView = {
        view_name: 'Default View',
        workspace_id: $workspaceStore.currentWorkspace.id,
        first_name: true,
        last_name: true,
        middle_name: false,
        emails: true,
        phone_numbers: true,
        addresses: false,
        gender: false,
        race: false,
        pronouns: false,
        social_media_accounts: false,
        vanid: false,
        filters: [],
        sorting: []
      };
      
      const { data: newView, error } = await data.supabase
        .from('contact_views')
        .insert(defaultView)
        .select()
        .single();
      
      if (error) throw error;
      
      views.set([newView]);
      currentView.set(newView);
      filters.set([]);
      sorting.set([]);
      
    } catch (error) {
      console.error('Error creating default view:', error);
      viewsError.set('Failed to create default view');
    }
  }
  
  // Create a new view
  async function createView(event) {
    const viewName = event.detail;
    if (!$workspaceStore.currentWorkspace || !viewName.trim()) return;
    
    try {
      // Create the view with default fields visible
      const newView = {
        view_name: viewName.trim(),
        workspace_id: $workspaceStore.currentWorkspace.id,
        first_name: true,
        last_name: true,
        middle_name: true,
        emails: true,
        phone_numbers: true,
        addresses: true,
        gender: true,
        race: true,
        pronouns: true,
        social_media_accounts: true,
        vanid: true,
        filters: [],
        sorting: []
      };
      
      const { data: createdView, error } = await data.supabase
        .from('contact_views')
        .insert(newView)
        .select()
        .single();
      
      if (error) throw error;
      
      // Close modal first to avoid any state issues
      isCreateViewModalOpen.set(false);
      newViewName.set('');
      
      // Re-fetch all views to ensure consistency
      await fetchViews();
      
      // Find the newly created view in the refreshed list
      const refreshedView = $views.find(v => v.id === createdView.id);
      if (refreshedView) {
        // Set as current view
        currentView.set(refreshedView);
        filters.set(refreshedView.filters || []);
        sorting.set(refreshedView.sorting || []);
      }
      
      toastStore.success('View created successfully');
      
    } catch (error) {
      console.error('Error creating view:', error);
      toastStore.error('Failed to create view');
    }
  }
  
  // Update a view
  async function updateView(event) {
    if (!$currentView) {
      console.error('No current view to update');
      return;
    }
    
    console.log('Received update event:', event?.detail);
    
    try {
      let updatedViewName = '';
      
      // Determine the new view name
      if (event && event.detail) {
        // Get name from event if available
        updatedViewName = event.detail.trim();
        console.log('Using name from event:', updatedViewName);
      } else if ($isEditViewModalOpen && $newViewName.trim()) {
        // Get name from store if modal is open
        updatedViewName = $newViewName.trim();
        console.log('Using name from store:', updatedViewName);
      } else {
        // Fallback to current name
        updatedViewName = $currentView.view_name;
        console.log('Using current name:', updatedViewName);
      }
      
      if (!updatedViewName) {
        console.error('No valid view name for update');
        return;
      }
      
      console.log('Updating view with name:', updatedViewName);
      
      // Create updated view object
      const updatedView = {
        ...$currentView,
        view_name: updatedViewName,
        filters: $filters,
        sorting: $sorting
      };
      
      console.log('Will update view ID:', $currentView.id);
      console.log('Full updated view:', updatedView);
      
      // Update in Supabase
      const { data: updatedData, error } = await data.supabase
        .from('contact_views')
        .update(updatedView)
        .eq('id', $currentView.id)
        .select();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Supabase update result:', updatedData);
      
      // Update the views list
      views.update(viewsList => 
        viewsList.map(view => view.id === $currentView.id 
          ? updatedView 
          : view
        )
      );
      
      // Update current view
      currentView.set(updatedView);
      
      // Close the edit modal if it's open
      if ($isEditViewModalOpen) {
        isEditViewModalOpen.set(false);
        newViewName.set('');
      }
      
      toastStore.success('View updated successfully');
      
      // Refresh views from database to ensure consistency
      await fetchViews($currentView.id);
      
    } catch (error) {
      console.error('Error updating view:', error);
      toastStore.error('Failed to update view: ' + (error.message || 'Unknown error'));
    }
  }
  
  // Delete a view
  async function deleteView() {
    if (!$currentView) return;
    
    try {
      const { error } = await data.supabase
        .from('contact_views')
        .delete()
        .eq('id', $currentView.id);
      
      if (error) throw error;
      
      // Remove the view from the list
      views.update(v => v.filter(view => view.id !== $currentView.id));
      
      // Set the first remaining view as current, or create a default if none left
      if ($views.length > 0) {
        currentView.set($views[0]);
        filters.set($views[0].filters || []);
        sorting.set($views[0].sorting || []);
      } else {
        await createDefaultView();
      }
      
      isDeleteViewModalOpen.set(false);
      toastStore.success('View deleted successfully');
      
    } catch (error) {
      console.error('Error deleting view:', error);
      toastStore.error('Failed to delete view');
    }
  }
  
  // Toggle a field's visibility in the current view
  async function toggleField(fieldId) {
    if (!$currentView) return;
    
    try {
      const updatedView = { ...$currentView, [fieldId]: !$currentView[fieldId] };
      
      const { error } = await data.supabase
        .from('contact_views')
        .update({ [fieldId]: !$currentView[fieldId] })
        .eq('id', $currentView.id);
      
      if (error) throw error;
      
      // Update the current view
      currentView.set(updatedView);
      
      // Update the view in the list
      views.update(v => 
        v.map(view => view.id === $currentView.id 
          ? updatedView 
          : view
        )
      );
      
    } catch (error) {
      console.error('Error toggling field:', error);
      toastStore.error('Failed to update view');
    }
  }
  
  // Add a new filter
  function addFilter() {
    filters.update(f => [
      ...f, 
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'first_name', operator: '=', value: '' }
    ]);
  }
  
  // Remove a filter
  function removeFilter(index) {
    filters.update(f => f.filter((_, i) => i !== index));
    updateView();
    applyFiltersAndSorting();
  }
  
  // Add a new sort
  function addSort() {
    sorting.update(s => [
      ...s, 
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'first_name', direction: 'asc' }
    ]);
  }
  
  // Remove a sort
  function removeSort(index) {
    sorting.update(s => s.filter((_, i) => i !== index));
    updateView();
    applyFiltersAndSorting();
  }
  
  // Move filter up or down
  function moveFilter(index, direction) {
    filters.update(f => {
      const newFilters = [...f];
      if (direction === 'up' && index > 0) {
        [newFilters[index], newFilters[index - 1]] = [newFilters[index - 1], newFilters[index]];
      } else if (direction === 'down' && index < newFilters.length - 1) {
        [newFilters[index], newFilters[index + 1]] = [newFilters[index + 1], newFilters[index]];
      }
      return newFilters;
    });
    updateView();
    applyFiltersAndSorting();
  }
  
  // Move sort up or down
  function moveSort(index, direction) {
    sorting.update(s => {
      const newSorting = [...s];
      if (direction === 'up' && index > 0) {
        [newSorting[index], newSorting[index - 1]] = [newSorting[index - 1], newSorting[index]];
      } else if (direction === 'down' && index < newSorting.length - 1) {
        [newSorting[index], newSorting[index + 1]] = [newSorting[index + 1], newSorting[index]];
      }
      return newSorting;
    });
    updateView();
    applyFiltersAndSorting();
  }
  
  // Function to fetch contacts
  async function fetchContacts() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isLoadingContacts.set(true);
    contactsError.set(null);
    
    try {
      // Use the get_contacts_by_workspace function to fetch contacts for the current workspace
      const { data: fetchedContacts, error } = await data.supabase
        .rpc('get_contacts_by_workspace', {
          workspace_id_param: $workspaceStore.currentWorkspace.id
        });
      
      if (error) throw error;
      
      // Add related contact data (emails, phones, etc.)
      const enhancedContacts = await Promise.all((fetchedContacts || []).map(async (contact) => {
        try {
          // Get email addresses
          const { data: emails } = await data.supabase
            .from('contact_emails')
            .select('*')
            .eq('contact_id', contact.id);
          
          // Get phone numbers
          const { data: phones } = await data.supabase
            .from('contact_phone_numbers')
            .select('*')
            .eq('contact_id', contact.id);
          
          // Get addresses
          const { data: addresses } = await data.supabase
            .from('contact_full_addresses')
            .select('*')
            .eq('contact_id', contact.id);
          
          // Get social media accounts
          const { data: socialMedia } = await data.supabase
            .from('contact_social_media_accounts')
            .select('*')
            .eq('contact_id', contact.id);
          
          // Get tags - explicitly filter by workspace
          const { data: tags } = await data.supabase
            .from('contact_tags')
            .select('*')
            .eq('contact_id', contact.id)
            .eq('workspace_id', $workspaceStore.currentWorkspace.id);
          
          // Return enhanced contact
          return {
            ...contact,
            emails: emails || [],
            phone_numbers: phones || [],
            addresses: addresses || [],
            social_media_accounts: socialMedia || [],
            tags: tags || []
          };
        } catch (err) {
          console.error('Error fetching contact details:', err);
          return contact;
        }
      }));
      
      contacts.set(enhancedContacts || []);
      applyFiltersAndSorting();
    } catch (error) {
      console.error('Error fetching contacts:', error);
      contactsError.set('Failed to load contacts');
    } finally {
      isLoadingContacts.set(false);
    }
  }
  
  // Apply filters and sorting to contacts
  function applyFiltersAndSorting() {
    let result = [...$contacts];
    
    // Apply filters
    if ($filters && $filters.length > 0) {
      $filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value) {
          result = result.filter(contact => {
            const contactValue = contact[filter.field];
            if (contactValue === null || contactValue === undefined) return false;
            
            switch(filter.operator) {
              case '=':
                return String(contactValue).toLowerCase() === String(filter.value).toLowerCase();
              case '!=':
                return String(contactValue).toLowerCase() !== String(filter.value).toLowerCase();
              case 'contains':
                return String(contactValue).toLowerCase().includes(String(filter.value).toLowerCase());
              case 'startsWith':
                return String(contactValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
              case 'endsWith':
                return String(contactValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
              case '>':
                return parseFloat(contactValue) > parseFloat(filter.value);
              case '<':
                return parseFloat(contactValue) < parseFloat(filter.value);
              case '>=':
                return parseFloat(contactValue) >= parseFloat(filter.value);
              case '<=':
                return parseFloat(contactValue) <= parseFloat(filter.value);
              default:
                return true;
            }
          });
        }
      });
    }
    
    // Apply search
    if ($searchQuery.trim()) {
      const query = $searchQuery.toLowerCase().trim();
      result = result.filter(contact => {
        // Helper function to safely check if a field includes the search query
        const fieldIncludes = (field) => {
          if (!field) return false;
          
          // Handle array values
          if (Array.isArray(field)) {
            return field.some(item => 
              String(item).toLowerCase().includes(query)
            );
          }
          
          // Handle comma-separated string values
          if (typeof field === 'string' && field.includes(',')) {
            return field.split(',').some(item => 
              item.trim().toLowerCase().includes(query)
            );
          }
          
          // Handle regular string/number values
          return String(field).toLowerCase().includes(query);
        };
        
        // Check all possible fields
        return (
          fieldIncludes(contact.first_name) ||
          fieldIncludes(contact.last_name) ||
          fieldIncludes(contact.middle_name) || 
          fieldIncludes(contact.email) ||
          fieldIncludes(contact.emails) ||
          fieldIncludes(contact.phone) ||
          fieldIncludes(contact.phone_number) ||
          fieldIncludes(contact.phone_numbers) ||
          fieldIncludes(contact.gender) ||
          fieldIncludes(contact.gender_name) ||
          fieldIncludes(contact.race) ||
          fieldIncludes(contact.race_name) ||
          fieldIncludes(contact.pronouns) ||
          fieldIncludes(contact.address) || 
          fieldIncludes(contact.addresses) ||
          fieldIncludes(contact.vanid)
        );
      });
    }
    
    // Apply sorting
    if ($sorting && $sorting.length > 0) {
      result.sort((a, b) => {
        for (const sort of $sorting) {
          if (!sort.field) continue;
          
          const valueA = a[sort.field] || '';
          const valueB = b[sort.field] || '';
          
          if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1;
          if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    filteredContacts.set(result);
  }
  
  // Watch for changes that should trigger filtering/sorting
  $: if ($searchQuery !== undefined) {
    applyFiltersAndSorting();
  }
  
  $: if ($filters !== undefined) {
    applyFiltersAndSorting();
  }
  
  $: if ($sorting !== undefined) {
    applyFiltersAndSorting();
  }
  
  // Initialize data on component mount
  onMount(() => {
    if ($workspaceStore.currentWorkspace) {
      fetchViews();
      fetchContacts();
    }
  });
  
  // Fetch data when workspace changes
  $: if ($workspaceStore.currentWorkspace) {
    fetchViews();
    fetchContacts();
  }
</script>

<svelte:head>
  <title>Contacts | Engagement Portal</title>
</svelte:head>

<div class="h-full flex flex-col">
  {#if $workspaceStore.isLoading}
    <div class="flex-1 flex justify-center items-center">
      <LoadingSpinner size="lg" />
    </div>
  {:else if !$workspaceStore.currentWorkspace}
    <div class="bg-white p-8 rounded-lg shadow-md m-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">No Workspace Selected</h2>
      <p class="text-gray-600">
        Please select a workspace from the dropdown in the sidebar to continue.
      </p>
    </div>
  {:else}
    <!-- Navbar with view selector and settings -->
    <ContactsViewNavbar 
      views={$views}
      currentView={$currentView}
      viewsLoading={$viewsLoading}
      viewsError={$viewsError}
      isViewSelectOpen={$isViewSelectOpen}
      isViewSettingsOpen={$isViewSettingsOpen}
      availableFields={$availableFields}
      on:selectView={handleSelectView}
      on:toggleField={handleToggleField}
      on:openCreateViewModal={handleOpenCreateViewModal}
      on:openEditViewModal={handleOpenEditViewModal}
      on:openDeleteViewModal={handleOpenDeleteViewModal}
      on:openContactModal={handleOpenContactModal}
    />
    
    <!-- Filter, sort, and search bar -->
    <ContactsFilterSortBar 
      isFilterPopoverOpen={$isFilterPopoverOpen}
      isSortPopoverOpen={$isSortPopoverOpen}
      filters={$filters}
      sorting={$sorting}
      searchQuery={$searchQuery}
      availableFields={$availableFields}
      currentView={$currentView}
      on:addFilter={handleAddFilter}
      on:removeFilter={handleRemoveFilter}
      on:moveFilter={handleMoveFilter}
      on:addSort={handleAddSort}
      on:removeSort={handleRemoveSort}
      on:moveSort={handleMoveSort}
      on:filterChanged={handleFilterChanged}
      on:sortChanged={handleSortChanged}
      on:searchChanged={handleSearchChanged}
    />
    
    <!-- Contacts data grid with details sheet integrated -->
    <ContactsDataGrid 
      contacts={$filteredContacts}
      isLoading={$isLoadingContacts}
      error={$contactsError}
      visibleColumns={$currentView ? Object.entries($currentView)
        .filter(([key, value]) => value === true && !key.startsWith('_'))
        .map(([key]) => key) : []}
      availableFields={$availableFields}
      supabase={data.supabase}
      on:addContact={handleAddContact}
      on:contactUpdated={handleContactUpdated}
    />
    
    <!-- Modals for contact and view management -->
    <ContactsViewModals 
      isContactModalOpen={$isContactModalOpen}
      isCreateViewModalOpen={$isCreateViewModalOpen}
      isEditViewModalOpen={$isEditViewModalOpen}
      isDeleteViewModalOpen={$isDeleteViewModalOpen}
      newViewName={$newViewName}
      currentView={$currentView}
      supabase={data.supabase}
      on:closeContactModal={handleCloseContactModal}
      on:contactCreated={handleContactCreated}
      on:createView={createView}
      on:updateView={updateView}
      on:deleteView={deleteView}
      on:closeCreateViewModal={() => isCreateViewModalOpen.set(false)}
      on:closeEditViewModal={() => isEditViewModalOpen.set(false)}
      on:closeDeleteViewModal={() => isDeleteViewModalOpen.set(false)}
    />
  {/if}
</div>