<!-- src/routes/engage/businesses/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { PageData } from './$types';
  
  // Import services
  import { 
    fetchBusinesses, 
    fetchPaginatedBusinesses,
    createBusiness, 
    updateBusiness, 
    deleteBusiness 
  } from '$lib/services/businessService';
  import { businessesPagination } from '$lib/stores/paginationStore';
  import { PAGINATION_CONFIG } from '$lib/config/pagination';
  
  import {
    fetchBusinessViews,
    createBusinessView,
    updateBusinessView,
    deleteBusinessView
  } from '$lib/services/businessViewService';
  
  // Import components
  import BusinessesViewNavbar from '$lib/components/businesses/BusinessesViewNavbar.svelte';
  import BusinessesFilterSortBar from '$lib/components/businesses/BusinessesFilterSortBar.svelte';
  import BusinessesDataGrid from '$lib/components/businesses/BusinessesDataGrid.svelte';
  import BusinessesViewModals from '$lib/components/businesses/BusinessesViewModals.svelte';
  import ImportModal from '$lib/components/import/ImportModal.svelte';
  
  export let data: PageData;
  
  // State for modals
  const isBusinessModalOpen = writable(false);
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
      ? localStorage.getItem('currentBusinessViewId') 
      : null;
    
    const { subscribe, set, update } = writable<any | null>(null);
    
    return {
      subscribe,
      set: (view) => {
        // Store the view ID in localStorage when set
        if (view && view.id && typeof window !== 'undefined') {
          localStorage.setItem('currentBusinessViewId', view.id);
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
    { id: 'businessName', label: 'Business Name' },
    { id: 'status', label: 'Status' },
    { id: 'addresses', label: 'Address' },
    { id: 'phoneNumbers', label: 'Phone' },
    { id: 'socialMediaAccounts', label: 'Social Media' },
    { id: 'employees', label: 'Employees' },
    { id: 'tags', label: 'Tags' },
    { id: 'createdAt', label: 'Created Date' },
    { id: 'updatedAt', label: 'Updated Date' }
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
  
  // Businesses data
  const businesses = writable<any[]>([]);
  const filteredBusinesses = writable<any[]>([]);
  const isLoadingBusinesses = writable(false);
  const businessesError = writable<string | null>(null);
  
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
    
    // Re-apply filters and sorting when view changes
    if (useClientSideFiltering) {
      applyFiltersAndSorting();
    } else {
      // Reset to page 1 and fetch server-side data with new view settings
      businessesPagination.setPage(1);
      isLoadingBusinesses.set(true);
      fetchPaginatedBusinessesData().finally(() => {
        isLoadingBusinesses.set(false);
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
  
  function handleOpenBusinessModal() {
    isBusinessModalOpen.set(true);
  }
  
  function handleOpenImportModal() {
    isImportModalOpen.set(true);
  }
  
  function handleCloseBusinessModal() {
    isBusinessModalOpen.set(false);
  }
  
  function handleBusinessCreated() {
    fetchBusinessesData();
  }
  
  function handleBusinessUpdated() {
    fetchBusinessesData();
  }
  
  function handlePageChanged(event) {
    const newPage = event.detail.page;
    console.log('Page changed to:', newPage);
    businessesPagination.setPage(newPage);
    
    // Always trigger server-side data fetch when page changes
    if (!useClientSideFiltering) {
      isLoadingBusinesses.set(true);
      fetchPaginatedBusinessesData().finally(() => {
        isLoadingBusinesses.set(false);
      });
    }
  }
  
  function handlePageSizeChanged(event) {
    const newPageSize = event.detail.pageSize;
    console.log('Page size changed to:', newPageSize);
    businessesPagination.setPageSize(newPageSize);
    
    // Always trigger server-side data fetch when page size changes
    if (!useClientSideFiltering) {
      isLoadingBusinesses.set(true);
      fetchPaginatedBusinessesData().finally(() => {
        isLoadingBusinesses.set(false);
      });
    }
  }
  
  function handleImportComplete() {
    isImportModalOpen.set(false);
    fetchBusinessesData();
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
      businessesPagination.setPage(1);
      // Use debounced search for server-side
      scheduleServerRefresh();
    }
  }
  
  function handleAddBusiness() {
    isBusinessModalOpen.set(true);
  }
  
  // Fetch views for the current workspace
  async function fetchViewsData(selectViewId = null) {
    if (!$workspaceStore.currentWorkspace) return;
    
    viewsLoading.set(true);
    viewsError.set(null);
    
    try {
      // Use the business view service
      const fetchedViews = await fetchBusinessViews($workspaceStore.currentWorkspace.id);
      
      if (fetchedViews && fetchedViews.length > 0) {
        views.set(fetchedViews);
        
        // If a specific view ID is provided, select that view
        if (selectViewId) {
          const viewToSelect = fetchedViews.find(view => view.id === selectViewId);
          if (viewToSelect) {
            currentView.set(viewToSelect);
            filters.set(viewToSelect.filters || []);
            sorting.set(viewToSelect.sorting || []);
            pendingFilters.set([...(viewToSelect.filters || [])]);
            pendingSorting.set([...(viewToSelect.sorting || [])]);
            hasFilterChanges.set(false);
            hasSortChanges.set(false);
            // Fetch data with the selected view
            fetchBusinessesData();
            return;
          }
        }
        
        // Try to restore the previously selected view from localStorage
        const storedViewId = typeof window !== 'undefined' 
          ? localStorage.getItem('currentBusinessViewId') 
          : null;
        
        if (storedViewId) {
          // Find the view with the stored ID
          const savedView = fetchedViews.find(view => view.id === storedViewId);
          if (savedView) {
            currentView.set(savedView);
            filters.set(savedView.filters || []);
            sorting.set(savedView.sorting || []);
            pendingFilters.set([...(savedView.filters || [])]);
            pendingSorting.set([...(savedView.sorting || [])]);
            hasFilterChanges.set(false);
            hasSortChanges.set(false);
            // Fetch data with the saved view
            fetchBusinessesData();
          } else {
            // If stored view is not found, use the first one
            currentView.set(fetchedViews[0]);
            filters.set(fetchedViews[0].filters || []);
            sorting.set(fetchedViews[0].sorting || []);
            pendingFilters.set([...(fetchedViews[0].filters || [])]);
            pendingSorting.set([...(fetchedViews[0].sorting || [])]);
            hasFilterChanges.set(false);
            hasSortChanges.set(false);
            // Fetch data with the first view
            fetchBusinessesData();
          }
        } else {
          // If no stored view, use the first one
          currentView.set(fetchedViews[0]);
          filters.set(fetchedViews[0].filters || []);
          sorting.set(fetchedViews[0].sorting || []);
          pendingFilters.set([...(fetchedViews[0].filters || [])]);
          pendingSorting.set([...(fetchedViews[0].sorting || [])]);
          hasFilterChanges.set(false);
          hasSortChanges.set(false);
          // Fetch data with the first view
          fetchBusinessesData();
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
      // Create a default view with standard fields
      const defaultView = await createBusinessView({
        viewName: 'Default View',
        workspaceId: $workspaceStore.currentWorkspace.id,
        businessName: true,
        addresses: true,
        phoneNumbers: true,
        socialMediaAccounts: false,
        employees: false,
        filters: [],
        sorting: []
      });
      
      views.set([defaultView]);
      currentView.set(defaultView);
      filters.set([]);
      sorting.set([]);
      pendingFilters.set([]);
      pendingSorting.set([]);
      hasFilterChanges.set(false);
      hasSortChanges.set(false);
      // Fetch data with the default view
      fetchBusinessesData();
      
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
      // Create the view
      const createdView = await createBusinessView({
        viewName: viewName.trim(),
        workspaceId: $workspaceStore.currentWorkspace.id,
        businessName: true,
        addresses: true,
        phoneNumbers: true,
        socialMediaAccounts: true,
        employees: true,
        filters: [],
        sorting: []
      });
      
      // Close modal first to avoid any state issues
      isCreateViewModalOpen.set(false);
      newViewName.set('');
      
      // Re-fetch all views to ensure consistency
      await fetchViewsData();
      
      // Find the newly created view in the refreshed list
      const refreshedView = $views.find(v => v.id === createdView.id);
      if (refreshedView) {
        // Set as current view
        currentView.set(refreshedView);
        filters.set(refreshedView.filters || []);
        sorting.set(refreshedView.sorting || []);
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
  async function updateView(event = null) {
    if (!$currentView) return;
    
    try {
      let updateData: any = {};
      
      // If editing the name (from event or from modal)
      if (event && typeof event.detail === 'string' && event.detail.trim()) {
        updateData.viewName = event.detail.trim();
      } else if ($isEditViewModalOpen && $newViewName.trim()) {
        updateData.viewName = $newViewName.trim();
      }
      
      // Update filters and sorting
      updateData.filters = $filters;
      updateData.sorting = $sorting;
      
      console.log('Updating view with:', updateData);
      
      // Use the business view service
      const updatedView = await updateBusinessView($currentView.id, updateData);
      
      // Update the view in the list
      views.update(v => 
        v.map(view => view.id === $currentView.id 
          ? updatedView 
          : view
        )
      );
      
      // Update current view
      currentView.set(updatedView);
      
      toastStore.success('View updated successfully');
      
      // Don't refresh views after update as it causes duplicate data fetches
      // The view was already updated in local state above
      
    } catch (error) {
      console.error('Error updating view:', error);
      toastStore.error('Failed to update view');
    }
  }
  
  // Delete a view
  async function deleteView() {
    if (!$currentView) return;
    
    try {
      // Use the business view service
      const success = await deleteBusinessView($currentView.id);
      
      if (success) {
        // Remove the view from the list
        views.update(v => v.filter(view => view.id !== $currentView.id));
        
        // Set the first remaining view as current, or create a default if none left
        if ($views.length > 0) {
          currentView.set($views[0]);
          filters.set($views[0].filters || []);
          sorting.set($views[0].sorting || []);
          pendingFilters.set([...($views[0].filters || [])]);
          pendingSorting.set([...($views[0].sorting || [])]);
          hasFilterChanges.set(false);
          hasSortChanges.set(false);
        } else {
          await createDefaultView();
        }
        
        isDeleteViewModalOpen.set(false);
        toastStore.success('View deleted successfully');
      }
      
    } catch (error) {
      console.error('Error deleting view:', error);
      toastStore.error('Failed to delete view');
    }
  }
  
  // Toggle a field's visibility in the current view
  async function toggleField(fieldId) {
    if (!$currentView) return;
    
    try {
      // Create an update object with the toggled field
      const updateData = {
        [fieldId]: !$currentView[fieldId]
      };
      
      // Use the business view service
      const updatedView = await updateBusinessView($currentView.id, updateData);
      
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
    pendingFilters.update(f => [
      ...f, 
      { field: Object.keys($currentView).find(key => $currentView[key] === true && key !== 'id' && key !== 'viewName' && key !== 'workspaceId') || 'businessName', operator: '=', value: '' }
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
      { field: Object.keys($currentView).find(key => $currentView[key] === true && key !== 'id' && key !== 'viewName' && key !== 'workspaceId') || 'businessName', direction: 'asc' }
    ]);
    hasSortChanges.set(true);
  }
  
  // Remove a sort
  function removeSort(index) {
    pendingSorting.update(s => s.filter((_, i) => i !== index));
    hasSortChanges.set(true);
  }
  
  // Move sort up or down
  function moveSort(index, direction) {
    pendingSorting.update(s => {
      const newSorting = [...s];
      if (direction === 'up' && index > 0) {
        [newSorting[index], newSorting[index - 1]] = [newSorting[index - 1], newSorting[index]];
      } else if (direction === 'down' && index < newSorting.length - 1) {
        [newSorting[index], newSorting[index + 1]] = [newSorting[index + 1], newSorting[index]];
      }
      return newSorting;
    });
    hasSortChanges.set(true);
  }
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
      isLoadingBusinesses.set(true);
      
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
      const result = await updateBusinessView($currentView.id, updatedView);
      
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
      businessesPagination.setPage(1);
      
      if (useClientSideFiltering) {
        applyFiltersAndSorting();
      } else {
        await fetchPaginatedBusinessesData();
      }
      
      toastStore.success('Filter and sort changes applied');
      
    } catch (error) {
      console.error('Error saving filter/sort changes:', error);
      toastStore.error('Failed to save changes: ' + (error.message || 'Unknown error'));
    } finally {
      isLoadingBusinesses.set(false);
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
  
  // Function to fetch businesses with pagination
  async function fetchBusinessesData() {
    if (!$workspaceStore.currentWorkspace) {
      console.log('No workspace available, skipping business fetch');
      return;
    }
    
    console.log('Fetching businesses data, useClientSideFiltering:', useClientSideFiltering);
    
    isLoadingBusinesses.set(true);
    businessesError.set(null);
    
    try {
      if (useClientSideFiltering) {
        // Client-side approach (for backward compatibility)
        console.log('Using client-side filtering');
        const businessData = await fetchBusinesses($workspaceStore.currentWorkspace.id);
        businesses.set(businessData || []);
        
        // Check if dataset is too large for client-side filtering
        if (businessData && businessData.length > PAGINATION_CONFIG.maxClientSideRecords) {
          console.warn(
            `Dataset too large for client-side filtering (${businessData.length} > ${PAGINATION_CONFIG.maxClientSideRecords}). ` +
            'Consider switching to server-side pagination by setting PAGINATION_CONFIG.useClientSideFiltering = false'
          );
        }
        
        applyFiltersAndSorting();
      } else {
        // Server-side approach (recommended for large datasets)
        console.log('Using server-side filtering');
        await fetchPaginatedBusinessesData();
      }
      
    } catch (error) {
      console.error('Error fetching businesses:', error);
      businessesError.set('Failed to load businesses');
    } finally {
      isLoadingBusinesses.set(false);
    }
  }
  
  // Function to fetch paginated businesses from server
  async function fetchPaginatedBusinessesData() {
    if (!$workspaceStore.currentWorkspace) {
      console.error('No workspace available for fetching businesses');
      return;
    }
    
    console.log('Fetching paginated businesses with params:', {
      page: $businessesPagination.currentPage,
      pageSize: $businessesPagination.pageSize,
      search: $searchQuery,
      filters: $filters,
      sorting: $sorting,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetchPaginatedBusinesses(
        $workspaceStore.currentWorkspace.id,
        {
          page: $businessesPagination.currentPage,
          pageSize: $businessesPagination.pageSize,
          search: $searchQuery,
          filters: $filters,
          sorting: $sorting
        }
      );
      
      console.log('Received paginated response at', new Date().toISOString(), ':', {
        businessesCount: response.businesses.length,
        firstBusiness: response.businesses[0] ? {
          businessName: response.businesses[0].businessName
        } : null,
        pagination: response.pagination
      });
      
      // Update businesses with server response
      filteredBusinesses.set(response.businesses);
      
      // Update pagination state
      businessesPagination.setTotalRecords(response.pagination.totalRecords);
      
      // Update current page if it changed on server
      if (response.pagination.currentPage !== $businessesPagination.currentPage) {
        businessesPagination.setPage(response.pagination.currentPage);
      }
      
    } catch (error) {
      console.error('Error fetching paginated businesses:', error);
      businessesError.set('Failed to fetch businesses: ' + (error.message || 'Unknown error'));
      throw error;
    }
  }
  
  // Apply filters and sorting to businesses (client-side)
  function applyFiltersAndSorting() {
    if (!useClientSideFiltering) return;
    
    let result = [...$businesses];
    
    // Apply filters
    if ($filters && $filters.length > 0) {
      $filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value) {
          result = result.filter(business => {
            // Convert field names from camelCase to snake_case if needed
            const fieldName = filter.field.replace(/([A-Z])/g, '_$1').toLowerCase();
            
            // Handle different field types appropriately
            const businessValue = business[filter.field] || business[fieldName];
            
            // Skip if the value is not available
            if (businessValue === null || businessValue === undefined) return false;
            
            // Handle array fields (like addresses, phoneNumbers)
            if (Array.isArray(businessValue)) {
              // For arrays, check if any element matches the filter
              return businessValue.some(item => {
                // For complex objects like addresses
                if (typeof item === 'object') {
                  // Check all properties of the item
                  return Object.values(item).some(val => 
                    val && String(val).toLowerCase().includes(String(filter.value).toLowerCase())
                  );
                }
                // For simple values
                return String(item).toLowerCase().includes(String(filter.value).toLowerCase());
              });
            }
            
            // Regular string comparison for simple fields
            switch(filter.operator) {
              case '=':
                return String(businessValue).toLowerCase() === String(filter.value).toLowerCase();
              case '!=':
                return String(businessValue).toLowerCase() !== String(filter.value).toLowerCase();
              case 'contains':
                return String(businessValue).toLowerCase().includes(String(filter.value).toLowerCase());
              case 'startsWith':
                return String(businessValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
              case 'endsWith':
                return String(businessValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
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
      result = result.filter(business => {
        // Search in business name (handling both camelCase and snake_case)
        if ((business.businessName || business.business_name) && 
            (business.businessName || '').toLowerCase().includes(query) || 
            (business.business_name || '').toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in addresses
        if (Array.isArray(business.addresses) && business.addresses.some(address => 
          Object.values(address).some(val => val && String(val).toLowerCase().includes(query))
        )) {
          return true;
        }
        
        // Search in phone numbers (handling both camelCase and snake_case)
        if ((Array.isArray(business.phoneNumbers) && business.phoneNumbers.some(phone => 
              phone.phoneNumber && phone.phoneNumber.toLowerCase().includes(query))) ||
            (Array.isArray(business.phone_numbers) && business.phone_numbers.some(phone => 
              phone.phone_number && phone.phone_number.toLowerCase().includes(query)))) {
          return true;
        }
        
        // Search in tags
        if (Array.isArray(business.tags) && business.tags.some(tag => 
          (tag.tag || tag) && (tag.tag || tag).toLowerCase().includes(query)
        )) {
          return true;
        }
        
        return false;
      });
    }
    
    // Apply sorting
    if ($sorting && $sorting.length > 0) {
      result.sort((a, b) => {
        for (const sort of $sorting) {
          if (!sort.field) continue;
          
          // Convert field names from camelCase to snake_case if needed
          const fieldName = sort.field.replace(/([A-Z])/g, '_$1').toLowerCase();
          
          let valueA = a[sort.field] || a[fieldName];
          let valueB = b[sort.field] || b[fieldName];
          
          // Handle array fields
          if (Array.isArray(valueA)) {
            valueA = valueA.length > 0 ? 
              (typeof valueA[0] === 'object' ? JSON.stringify(valueA[0]) : valueA[0]) : 
              '';
          }
          
          if (Array.isArray(valueB)) {
            valueB = valueB.length > 0 ? 
              (typeof valueB[0] === 'object' ? JSON.stringify(valueB[0]) : valueB[0]) : 
              '';
          }
          
          // Convert to strings for comparison
          valueA = valueA || '';
          valueB = valueB || '';
          
          if (String(valueA).toLowerCase() < String(valueB).toLowerCase()) {
            return sort.direction === 'asc' ? -1 : 1;
          }
          if (String(valueA).toLowerCase() > String(valueB).toLowerCase()) {
            return sort.direction === 'asc' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    
    filteredBusinesses.set(result);
    
    // Update pagination total records whenever filtering changes
    // If we're on a page that no longer exists due to filtering changes, reset to page 1
    const currentTotalRecords = $businessesPagination.totalRecords;
    const newTotalRecords = result.length;
    
    // Update total records first
    businessesPagination.setTotalRecords(newTotalRecords);
    
    // If the current page would be beyond the new total pages, reset to page 1
    if (newTotalRecords !== currentTotalRecords) {
      const newTotalPages = Math.ceil(newTotalRecords / $businessesPagination.pageSize);
      if ($businessesPagination.currentPage > newTotalPages && newTotalPages > 0) {
        businessesPagination.setPage(1);
      }
    }
  }
  
  // Only fetch when workspace changes and we don't already have a view loaded
  $: if ($workspaceStore.currentWorkspace && !$currentView) {
    fetchViewsData();
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
        isLoadingBusinesses.set(true);
        fetchPaginatedBusinessesData().finally(() => {
          isLoadingBusinesses.set(false);
        });
      }, PAGINATION_CONFIG.searchDebounceMs);
    }
  }
</script>

<svelte:head>
  <title>Businesses | Engagement Portal</title>
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
    <BusinessesViewNavbar 
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
      on:openBusinessModal={handleOpenBusinessModal}
      on:openImportModal={handleOpenImportModal}
    />
    
    <!-- Filter, sort, and search bar -->
    <BusinessesFilterSortBar 
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
    
    <!-- Businesses data grid with details sheet integrated -->
    <BusinessesDataGrid 
      businesses={$filteredBusinesses}
      isLoading={$isLoadingBusinesses}
      error={$businessesError}
      visibleColumns={$currentView ? Object.entries($currentView)
        .filter(([key, value]) => value === true && !key.startsWith('_') && !['id', 'viewName', 'workspaceId', 'filters', 'sorting', 'createdAt', 'updatedAt', 'createdById'].includes(key))
        .map(([key]) => key) : []}
      availableFields={$availableFields}
      supabase={data.supabase}
      currentPage={$businessesPagination.currentPage}
      totalPages={$businessesPagination.totalPages}
      totalRecords={$businessesPagination.totalRecords}
      pageSize={$businessesPagination.pageSize}
      on:addBusiness={handleAddBusiness}
      on:businessUpdated={handleBusinessUpdated}
      on:pageChanged={handlePageChanged}
      on:pageSizeChanged={handlePageSizeChanged}
    />
    
    <!-- Modals for business and view management -->
    <BusinessesViewModals 
      isBusinessModalOpen={$isBusinessModalOpen}
      isCreateViewModalOpen={$isCreateViewModalOpen}
      isEditViewModalOpen={$isEditViewModalOpen}
      isDeleteViewModalOpen={$isDeleteViewModalOpen}
      newViewName={$newViewName}
      currentView={$currentView}
      supabase={data.supabase}
      on:closeBusinessModal={handleCloseBusinessModal}
      on:businessCreated={handleBusinessCreated}
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
      importType="businesses"
      workspaceId={$workspaceStore.currentWorkspace?.id}
      on:close={() => isImportModalOpen.set(false)}
      on:importComplete={handleImportComplete}
    />
  {/if}
</div>