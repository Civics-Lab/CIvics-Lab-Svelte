<!-- src/routes/engage/contacts/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchContacts, fetchPaginatedContacts, createContact, updateContact, deleteContact } from '$lib/services/contactService';
  import { contactsPagination } from '$lib/stores/paginationStore';
  import { fetchContactViews, createContactView, updateContactView, deleteContactView, createDefaultContactView } from '$lib/services/contactViewService';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { PageData } from './$types';
  import { PAGINATION_CONFIG } from '$lib/config/pagination';
  
  // Import components
  import ContactsViewNavbar from '$lib/components/contacts/ContactsViewNavbar.svelte';
  import ContactsFilterSortBar from '$lib/components/contacts/ContactsFilterSortBar.svelte';
  import ContactsDataGrid from '$lib/components/contacts/ContactsDataGrid.svelte';
  import ContactsViewModals from '$lib/components/contacts/ContactsViewModals.svelte';
  import ImportModal from '$lib/components/import/ImportModal.svelte';
  
  export let data: PageData;
  // Mark data as used for build
  $: data;
  
  // State for modals
  const isContactModalOpen = writable(false);
  const isCreateViewModalOpen = writable(false);
  const isEditViewModalOpen = writable(false);
  const isDeleteViewModalOpen = writable(false);
  const isImportModalOpen = writable(false);
  
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
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'middleName', label: 'Middle Name' },
    { id: 'gender', label: 'Gender' },
    { id: 'race', label: 'Race' },
    { id: 'pronouns', label: 'Pronouns' },
    { id: 'emails', label: 'Email' },
    { id: 'phoneNumbers', label: 'Phone' },
    { id: 'addresses', label: 'Address' },
    { id: 'socialMediaAccounts', label: 'Social Media' },
    { id: 'vanid', label: 'VAN ID' },
  ]);
  
  // Filters state
  const filters = writable<any[]>([]);
  const pendingFilters = writable<any[]>([]);
  const hasFilterChanges = writable(false);
  
  // Sort state
  const sorting = writable<any[]>([]);
  const pendingSorting = writable<any[]>([]);
  const hasSortChanges = writable(false);
  
  // Search state
  const searchQuery = writable('');
  
  // Contacts data
  const contacts = writable<any[]>([]);
  const filteredContacts = writable<any[]>([]);
  const isLoadingContacts = writable(false);
  const contactsError = writable<string | null>(null);
  
  // For backward compatibility - track if we're using client-side filtering
  let useClientSideFiltering = PAGINATION_CONFIG.useClientSideFiltering;
  
  // View event handlers
  function handleSelectView(event) {
    const view = event.detail;
    currentView.set(view);
    filters.set(view.filters || []);
    sorting.set(view.sorting || []);
    
    // Initialize pending state with current view settings
    pendingFilters.set([...(view.filters || [])]);
    pendingSorting.set([...(view.sorting || [])]);
    hasFilterChanges.set(false);
    hasSortChanges.set(false);
    
    console.log('Selected view with filters:', view.filters, 'and sorting:', view.sorting);
    
    // Re-apply filters and sorting when view changes
    if (useClientSideFiltering) {
      applyFiltersAndSorting();
    } else {
      // Reset to page 1 and fetch server-side data with new view settings
      contactsPagination.setPage(1);
      isLoadingContacts.set(true);
      fetchPaginatedContactsData().finally(() => {
        isLoadingContacts.set(false);
      });
    }
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
      newViewName.set($currentView.viewName);
      isEditViewModalOpen.set(true);
    }
  }
  
  function handleOpenDeleteViewModal() {
    isDeleteViewModalOpen.set(true);
  }
  
  function handleOpenContactModal() {
    isContactModalOpen.set(true);
  }
  
  function handleOpenImportModal() {
    isImportModalOpen.set(true);
  }
  
  function handleCloseContactModal() {
    isContactModalOpen.set(false);
  }
  
  function handleContactCreated() {
    fetchContactsData();
  }
  
  function handleContactUpdated() {
    fetchContactsData();
  }
  
  function handlePageChanged(event) {
    const newPage = event.detail.page;
    console.log('Page changed to:', newPage);
    contactsPagination.setPage(newPage);
    
    // Always trigger server-side data fetch when page changes
    if (!useClientSideFiltering) {
      isLoadingContacts.set(true);
      fetchPaginatedContactsData().finally(() => {
        isLoadingContacts.set(false);
      });
    }
  }
  
  function handlePageSizeChanged(event) {
    const newPageSize = event.detail.pageSize;
    console.log('Page size changed to:', newPageSize);
    contactsPagination.setPageSize(newPageSize);
    
    // Always trigger server-side data fetch when page size changes
    if (!useClientSideFiltering) {
      isLoadingContacts.set(true);
      fetchPaginatedContactsData().finally(() => {
        isLoadingContacts.set(false);
      });
    }
  }
  
  function handleImportComplete() {
    isImportModalOpen.set(false);
    fetchContactsData();
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
    // Don't auto-update, just mark as having changes
    hasFilterChanges.set(true);
  }
  
  function handleSortChanged() {
    // Don't auto-update, just mark as having changes
    hasSortChanges.set(true);
  }
  
  function handleSearchChanged(event) {
    // Update the searchQuery store with the value from the event
    if (event && event.detail !== undefined) {
      searchQuery.set(event.detail);
    }
    
    if (useClientSideFiltering) {
      applyFiltersAndSorting();
    } else {
      // Reset to page 1 when search changes, then fetch data
      contactsPagination.setPage(1);
      // Use debounced search for server-side
      scheduleServerRefresh();
    }
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
      const fetchedViews = await fetchContactViews($workspaceStore.currentWorkspace.id);
      
      if (fetchedViews && fetchedViews.length > 0) {
        views.set(fetchedViews);
        
        // If a specific view ID is provided, select that view
        if (selectViewId) {
          const viewToSelect = fetchedViews.find(view => view.id === selectViewId);
          if (viewToSelect) {
          currentView.set(viewToSelect);
          filters.set(viewToSelect.filters || []);
          sorting.set(viewToSelect.sorting || []);
          // Initialize pending states
          pendingFilters.set([...(viewToSelect.filters || [])]);
          pendingSorting.set([...(viewToSelect.sorting || [])]);
          hasFilterChanges.set(false);
          hasSortChanges.set(false);
          // Fetch data with the selected view
            fetchContactsData();
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
          // Initialize pending states
          pendingFilters.set([...(savedView.filters || [])]);
          pendingSorting.set([...(savedView.sorting || [])]);
          hasFilterChanges.set(false);
          hasSortChanges.set(false);
          // Fetch data with the saved view
          fetchContactsData();
          } else {
          // If stored view is not found, use the first one
          currentView.set(fetchedViews[0]);
          filters.set(fetchedViews[0].filters || []);
          sorting.set(fetchedViews[0].sorting || []);
          // Initialize pending states
          pendingFilters.set([...(fetchedViews[0].filters || [])]);
          pendingSorting.set([...(fetchedViews[0].sorting || [])]);
          hasFilterChanges.set(false);
          hasSortChanges.set(false);
          // Fetch data with the first view
          fetchContactsData();
        }
        } else {
        // If no stored view, use the first one
        currentView.set(fetchedViews[0]);
        filters.set(fetchedViews[0].filters || []);
        sorting.set(fetchedViews[0].sorting || []);
        // Initialize pending states
        pendingFilters.set([...(fetchedViews[0].filters || [])]);
        pendingSorting.set([...(fetchedViews[0].sorting || [])]);
        hasFilterChanges.set(false);
        hasSortChanges.set(false);
        // Fetch data with the first view
        fetchContactsData();
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
      const newView = await createDefaultContactView($workspaceStore.currentWorkspace.id);
      
      views.set([newView]);
      currentView.set(newView);
      filters.set([]);
      sorting.set([]);
      // Initialize pending states
      pendingFilters.set([]);
      pendingSorting.set([]);
      hasFilterChanges.set(false);
      hasSortChanges.set(false);
      // Fetch data with the default view
      fetchContactsData();
      
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
      const newView = await createContactView({
        viewName: viewName.trim(),
        workspaceId: $workspaceStore.currentWorkspace.id,
        firstName: true,
        lastName: true,
        middleName: true,
        emails: true,
        phoneNumbers: true,
        addresses: true,
        gender: true,
        race: true,
        pronouns: true,
        socialMediaAccounts: true,
        vanid: true,
        filters: [],
        sorting: []
      });
      
      // Close modal first to avoid any state issues
      isCreateViewModalOpen.set(false);
      newViewName.set('');
      
      // Re-fetch all views to ensure consistency
      await fetchViews();
      
      // Find the newly created view in the refreshed list
      const refreshedView = $views.find(v => v.id === newView.id);
      if (refreshedView) {
        // Set as current view
        currentView.set(refreshedView);
        filters.set(refreshedView.filters || []);
        sorting.set(refreshedView.sorting || []);
        // Initialize pending states
        pendingFilters.set([...(refreshedView.filters || [])]);
        pendingSorting.set([...(refreshedView.sorting || [])]);
        hasFilterChanges.set(false);
        hasSortChanges.set(false);
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
        updatedViewName = $currentView.viewName;
        console.log('Using current name:', updatedViewName);
      }
      
      if (!updatedViewName) {
        console.error('No valid view name for update');
        return;
      }
      
      console.log('Updating view with name:', updatedViewName);
      
      // Create updated view object with proper property names
      const updatedView = {
        viewName: updatedViewName,
        filters: $filters,
        sorting: $sorting
      };
      
      console.log('Will update view ID:', $currentView.id);
      console.log('Full updated view:', updatedView);
      
      // Update using API
      const result = await updateContactView($currentView.id, updatedView);
      
      console.log('API update result:', result);
      
      // Update the views list
      views.update(viewsList => 
        viewsList.map(view => view.id === $currentView.id 
          ? { ...view, ...updatedView } 
          : view
        )
      );
      
      // Update current view
      currentView.update(view => ({ ...view, ...updatedView }));
      
      // Close the edit modal if it's open
      if ($isEditViewModalOpen) {
        isEditViewModalOpen.set(false);
        newViewName.set('');
      }
      
      toastStore.success('View updated successfully');
      
      // Don't refresh views after update as it causes duplicate data fetches
      // The view was already updated in local state above
      
    } catch (error) {
      console.error('Error updating view:', error);
      toastStore.error('Failed to update view: ' + (error.message || 'Unknown error'));
    }
  }
  
  // Delete a view
  async function deleteView() {
    if (!$currentView) return;
    
    try {
      await deleteContactView($currentView.id);
      
      // Remove the view from the list
      views.update(v => v.filter(view => view.id !== $currentView.id));
      
      // Set the first remaining view as current, or create a default if none left
      if ($views.length > 0) {
        currentView.set($views[0]);
        filters.set($views[0].filters || []);
        sorting.set($views[0].sorting || []);
        // Initialize pending states
        pendingFilters.set([...($views[0].filters || [])]);
        pendingSorting.set([...($views[0].sorting || [])]);
        hasFilterChanges.set(false);
        hasSortChanges.set(false);
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
      // Create the field update object with the toggled field
      const fieldUpdate = { [fieldId]: !$currentView[fieldId] };
      
      // Update the view via the API
      await updateContactView($currentView.id, fieldUpdate);
      
      // Update the current view
      currentView.update(view => ({
        ...view,
        [fieldId]: !view[fieldId]
      }));
      
      // Update the view in the list
      views.update(v => 
        v.map(view => view.id === $currentView.id 
          ? { ...view, [fieldId]: !view[fieldId] } 
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
    pendingFilters.update(f => [
      ...f, 
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'firstName', operator: '=', value: '' }
    ]);
    hasFilterChanges.set(true);
  }
  
  // Remove a filter
  function removeFilter(index) {
    pendingFilters.update(f => f.filter((_, i) => i !== index));
    hasFilterChanges.set(true);
  }
  
  // Add a new sort
  function addSort() {
    pendingSorting.update(s => [
      ...s, 
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'firstName', direction: 'asc' }
    ]);
    hasSortChanges.set(true);
  }
  
  // Remove a sort
  function removeSort(index) {
    pendingSorting.update(s => s.filter((_, i) => i !== index));
    hasSortChanges.set(true);
  }
  
  // Move filter up or down
  function moveFilter(index, direction) {
    pendingFilters.update(f => {
      const newFilters = [...f];
      if (direction === 'up' && index > 0) {
        [newFilters[index], newFilters[index - 1]] = [newFilters[index - 1], newFilters[index]];
      } else if (direction === 'down' && index < newFilters.length - 1) {
        [newFilters[index], newFilters[index + 1]] = [newFilters[index + 1], newFilters[index]];
      }
      return newFilters;
    });
    hasFilterChanges.set(true);
  }
  
  // Save filter/sort changes
  async function saveFilterSortChanges() {
    if (!$currentView) {
      console.error('No current view to update');
      return;
    }
    
    try {
      isLoadingContacts.set(true);
      
      // Apply pending changes to actual state
      if ($hasFilterChanges) {
        filters.set([...$pendingFilters]);
        hasFilterChanges.set(false);
      }
      
      if ($hasSortChanges) {
        sorting.set([...$pendingSorting]);
        hasSortChanges.set(false);
      }
      
      // Update the view in the database with the new filter and sort data
      const updatedView = {
        filters: $filters,
        sorting: $sorting
      };
      
      console.log('Saving filter/sort changes:', updatedView);
      
      // Update using API
      const result = await updateContactView($currentView.id, updatedView);
      
      console.log('API update result:', result);
      
      // Update the views list
      views.update(viewsList => 
        viewsList.map(view => view.id === $currentView.id 
          ? { ...view, ...updatedView } 
          : view
        )
      );
      
      // Update current view
      currentView.update(view => ({ ...view, ...updatedView }));
      
      // Reset pagination to page 1 and fetch new data
      contactsPagination.setPage(1);
      
      if (useClientSideFiltering) {
        applyFiltersAndSorting();
      } else {
        await fetchPaginatedContactsData();
      }
      
      toastStore.success('Filter and sort changes applied');
      
    } catch (error) {
      console.error('Error saving filter/sort changes:', error);
      toastStore.error('Failed to save changes: ' + (error.message || 'Unknown error'));
    } finally {
      isLoadingContacts.set(false);
    }
  }
  
  // Cancel filter/sort changes
  function cancelFilterSortChanges() {
    // Reset pending changes to current saved state
    pendingFilters.set([...$filters]);
    pendingSorting.set([...$sorting]);
    hasFilterChanges.set(false);
    hasSortChanges.set(false);
  }
  
  // Function to fetch contacts with pagination
  async function fetchContactsData() {
    if (!$workspaceStore.currentWorkspace) {
      console.log('No workspace available, skipping contact fetch');
      return;
    }
    
    console.log('Fetching contacts data, useClientSideFiltering:', useClientSideFiltering);
    
    isLoadingContacts.set(true);
    contactsError.set(null);
    
    try {
      if (useClientSideFiltering) {
        // Client-side approach (for backward compatibility)
        console.log('Using client-side filtering');
        const contactsData = await fetchContacts($workspaceStore.currentWorkspace.id);
        contacts.set(contactsData || []);
        
        // Check if dataset is too large for client-side filtering
        if (contactsData && contactsData.length > PAGINATION_CONFIG.maxClientSideRecords) {
          console.warn(
            `Dataset too large for client-side filtering (${contactsData.length} > ${PAGINATION_CONFIG.maxClientSideRecords}). ` +
            'Consider switching to server-side pagination by setting PAGINATION_CONFIG.useClientSideFiltering = false'
          );
        }
        
        applyFiltersAndSorting();
      } else {
        // Server-side approach (recommended for large datasets)
        console.log('Using server-side filtering');
        await fetchPaginatedContactsData();
      }
      
    } catch (error) {
      console.error('Error fetching contacts:', error);
      contactsError.set('Failed to load contacts');
    } finally {
      isLoadingContacts.set(false);
    }
  }
  
  // Function to fetch paginated contacts from server
  async function fetchPaginatedContactsData() {
    if (!$workspaceStore.currentWorkspace) {
      console.error('No workspace available for fetching contacts');
      return;
    }
    
    console.log('Fetching paginated contacts with params:', {
      page: $contactsPagination.currentPage,
      pageSize: $contactsPagination.pageSize,
      search: $searchQuery,
      filters: $filters,
      sorting: $sorting,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetchPaginatedContacts(
        $workspaceStore.currentWorkspace.id,
        {
          page: $contactsPagination.currentPage,
          pageSize: $contactsPagination.pageSize,
          search: $searchQuery,
          filters: $filters,
          sorting: $sorting
        }
      );
      
      console.log('Received paginated response at', new Date().toISOString(), ':', {
        contactsCount: response.contacts.length,
        firstContact: response.contacts[0] ? {
          firstName: response.contacts[0].firstName,
          lastName: response.contacts[0].lastName
        } : null,
        pagination: response.pagination
      });
      
      // Update contacts with server response
      filteredContacts.set(response.contacts);
      
      // Update pagination state
      contactsPagination.setTotalRecords(response.pagination.totalRecords);
      
      // Update current page if it changed on server
      if (response.pagination.currentPage !== $contactsPagination.currentPage) {
        contactsPagination.setPage(response.pagination.currentPage);
      }
      
    } catch (error) {
      console.error('Error fetching paginated contacts:', error);
      contactsError.set('Failed to fetch contacts: ' + (error.message || 'Unknown error'));
      throw error;
    }
  }
  
  // Apply filters and sorting to contacts (client-side)
  function applyFiltersAndSorting() {
    if (!useClientSideFiltering) return;
    
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
          fieldIncludes(contact.firstName) ||
          fieldIncludes(contact.lastName) ||
          fieldIncludes(contact.middleName) || 
          fieldIncludes(contact.email) ||
          fieldIncludes(contact.emails) ||
          fieldIncludes(contact.phone) ||
          fieldIncludes(contact.phoneNumber) ||
          fieldIncludes(contact.phoneNumbers) ||
          fieldIncludes(contact.gender) ||
          fieldIncludes(contact.genderName) ||
          fieldIncludes(contact.race) ||
          fieldIncludes(contact.raceName) ||
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
    
    // Update pagination total records whenever filtering changes
    // If we're on a page that no longer exists due to filtering changes, reset to page 1
    const currentTotalRecords = $contactsPagination.totalRecords;
    const newTotalRecords = result.length;
    
    // Update total records first
    contactsPagination.setTotalRecords(newTotalRecords);
    
    // If the current page would be beyond the new total pages, reset to page 1
    if (newTotalRecords !== currentTotalRecords) {
      const newTotalPages = Math.ceil(newTotalRecords / $contactsPagination.pageSize);
      if ($contactsPagination.currentPage > newTotalPages && newTotalPages > 0) {
        contactsPagination.setPage(1);
      }
    }
  }
  
  // Only fetch when workspace changes and we don't already have a view loaded
  $: if ($workspaceStore.currentWorkspace && !$currentView) {
    fetchViews();
  }
  
  // Debounced data refresh for client-side filtering
  let refreshTimeout;
  function scheduleRefresh() {
    if (useClientSideFiltering) {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        applyFiltersAndSorting();
      }, PAGINATION_CONFIG.clientDebounceMs);
    }
  }
  
  // Debounced server refresh for search changes only
  let serverRefreshTimeout;
  function scheduleServerRefresh() {
    if (!useClientSideFiltering) {
      clearTimeout(serverRefreshTimeout);
      serverRefreshTimeout = setTimeout(() => {
        console.log('Executing scheduled server refresh for search');
        isLoadingContacts.set(true);
        fetchPaginatedContactsData().finally(() => {
          isLoadingContacts.set(false);
        });
      }, PAGINATION_CONFIG.searchDebounceMs);
    }
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
      on:openImportModal={handleOpenImportModal}
    />
    
    <!-- Filter, sort, and search bar -->
    <ContactsFilterSortBar 
      isFilterPopoverOpen={$isFilterPopoverOpen}
      isSortPopoverOpen={$isSortPopoverOpen}
      filters={$pendingFilters}
      sorting={$pendingSorting}
      searchQuery={$searchQuery}
      availableFields={$availableFields}
      currentView={$currentView}
      hasFilterChanges={$hasFilterChanges}
      hasSortChanges={$hasSortChanges}
      on:addFilter={handleAddFilter}
      on:removeFilter={handleRemoveFilter}
      on:moveFilter={handleMoveFilter}
      on:addSort={handleAddSort}
      on:removeSort={handleRemoveSort}
      on:moveSort={handleMoveSort}
      on:filterChanged={handleFilterChanged}
      on:sortChanged={handleSortChanged}
      on:searchChanged={handleSearchChanged}
      on:saveChanges={saveFilterSortChanges}
      on:cancelChanges={cancelFilterSortChanges}
    />
    
    <!-- Contacts data grid with details sheet integrated -->
    <ContactsDataGrid 
      contacts={$filteredContacts}
      isLoading={$isLoadingContacts}
      error={$contactsError}
      visibleColumns={$currentView ? Object.entries($currentView)
        .filter(([key, value]) => value === true && key !== 'id' && key !== 'viewName' && key !== 'workspaceId' && key !== 'filters' && key !== 'sorting' && key !== 'createdById' && key !== 'createdAt' && key !== 'updatedAt')
        .map(([key]) => key) : []}
      availableFields={$availableFields}
      currentPage={$contactsPagination.currentPage}
      totalPages={$contactsPagination.totalPages}
      totalRecords={$contactsPagination.totalRecords}
      pageSize={$contactsPagination.pageSize}
      on:addContact={handleAddContact}
      on:contactUpdated={handleContactUpdated}
      on:pageChanged={handlePageChanged}
      on:pageSizeChanged={handlePageSizeChanged}
    />
    
    <!-- Modals for contact and view management -->
    <ContactsViewModals 
      isContactModalOpen={$isContactModalOpen}
      isCreateViewModalOpen={$isCreateViewModalOpen}
      isEditViewModalOpen={$isEditViewModalOpen}
      isDeleteViewModalOpen={$isDeleteViewModalOpen}
      newViewName={$newViewName}
      currentView={$currentView}
      on:closeContactModal={handleCloseContactModal}
      on:contactCreated={handleContactCreated}
      on:createView={createView}
      on:updateView={updateView}
      on:deleteView={deleteView}
      on:closeCreateViewModal={() => isCreateViewModalOpen.set(false)}
      on:closeEditViewModal={() => isEditViewModalOpen.set(false)}
      on:closeDeleteViewModal={() => isDeleteViewModalOpen.set(false)}
    />
    
    <!-- Import Modal -->
    <ImportModal 
      bind:isOpen={$isImportModalOpen}
      importType="contacts"
      workspaceId={$workspaceStore.currentWorkspace?.id}
      on:close={() => isImportModalOpen.set(false)}
      on:importComplete={handleImportComplete}
    />
  {/if}
</div>