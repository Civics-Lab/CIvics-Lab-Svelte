<!-- src/routes/app/donations/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  
  // Import services
  import { 
    fetchDonations, 
    fetchPaginatedDonations,
    createDonation, 
    updateDonation, 
    deleteDonation 
  } from '$lib/services/donationService';
  import { donationsPagination } from '$lib/stores/paginationStore';
  
  // Import components
  import DonationsViewNavbar from '$lib/components/donations/DonationsViewNavbar.svelte';
  import DonationsFilterSortBar from '$lib/components/donations/DonationsFilterSortBar.svelte';
  import DonationsDataGrid from '$lib/components/donations/DonationsDataGrid.svelte';
  import DonationsViewModals from '$lib/components/donations/DonationsViewModals.svelte';
  
  // State for modals
  const isDonationModalOpen = writable(false);
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
      ? localStorage.getItem('currentDonationViewId') 
      : null;
    
    const { subscribe, set, update } = writable<any | null>(null);
    
    return {
      subscribe,
      set: (view) => {
        // Store the view ID in localStorage when set
        if (view && view.id && typeof window !== 'undefined') {
          localStorage.setItem('currentDonationViewId', view.id);
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
    { id: 'amount', label: 'Amount' },
    { id: 'status', label: 'Status' },
    { id: 'paymentType', label: 'Payment Type' },
    { id: 'notes', label: 'Notes' }
    // Note: donorName and donorType are computed fields from the API, not database fields
  ]);
  
  // Filters state
  const filters = writable<any[]>([]);
  
  // Sort state
  const sorting = writable<any[]>([]);
  
  // Search state
  const searchQuery = writable('');
  
  // Donations data
  const donations = writable<any[]>([]);
  const filteredDonations = writable<any[]>([]);
  const isLoadingDonations = writable(false);
  const donationsError = writable<string | null>(null);
  
  // For backward compatibility - track if we're using client-side filtering
  let useClientSideFiltering = false;
  
  // Donation stats
  const donationStats = writable({
    totalAmount: 0,
    averageAmount: 0,
    donorCount: 0
  });
  
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
      newViewName.set($currentView.viewName);
      isEditViewModalOpen.set(true);
    }
  }
  
  function handleOpenDeleteViewModal() {
    isDeleteViewModalOpen.set(true);
  }
  
  function handleOpenDonationModal() {
    isDonationModalOpen.set(true);
  }
  
  function handleCloseDonationModal() {
    isDonationModalOpen.set(false);
  }
  
  function handleDonationCreated() {
    fetchDonationsData();
  }
  
  function handleDonationUpdated() {
    fetchDonationsData();
  }
  
  function handlePageChanged(event) {
    donationsPagination.setPage(event.detail.page);
  }
  
  function handlePageSizeChanged(event) {
    donationsPagination.setPageSize(event.detail.pageSize);
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
  
  function handleAddDonation() {
    isDonationModalOpen.set(true);
  }
  
  // Fetch views for the current workspace using the API
  async function fetchViews(selectViewId = null) {
    if (!$workspaceStore.currentWorkspace) return;
    
    viewsLoading.set(true);
    viewsError.set(null);
    
    try {
      // Use the API endpoint to fetch donation views
      const response = await fetch(`/api/donation-views?workspace_id=${$workspaceStore.currentWorkspace.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch donation views');
      }
      
      const data = await response.json();
      const fetchedViews = data.views || [];
      
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
          ? localStorage.getItem('currentDonationViewId') 
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
        viewName: 'Default View',
        workspaceId: $workspaceStore.currentWorkspace.id,
        amount: true,
        status: true,
        paymentType: true,
        notes: false,
        filters: [],
        sorting: []
      };
      
      // Use the API endpoint to create a default view
      const response = await fetch('/api/donation-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(defaultView)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create default view');
      }
      
      const responseData = await response.json();
      const newView = responseData.view;
      
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
        viewName: viewName.trim(),
        workspaceId: $workspaceStore.currentWorkspace.id,
        amount: true,
        status: true,
        paymentType: true,
        notes: true,
        filters: [],
        sorting: []
      };
      
      // Use the API endpoint to create a new view
      const response = await fetch('/api/donation-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newView)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create view');
      }
      
      const responseData = await response.json();
      const createdView = responseData.view;
      
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
      
      // Use the API endpoint to update the view
      const response = await fetch(`/api/donation-views/${$currentView.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedView)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update view');
      }
      
      console.log('API update successful');
      
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
      // Use the API endpoint to delete the view
      const response = await fetch(`/api/donation-views/${$currentView.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete view');
      }
      
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
      // Create the field update object with the toggled field
      const fieldUpdate = { [fieldId]: !$currentView[fieldId] };
      
      // Use the API endpoint to update the field visibility
      const response = await fetch(`/api/donation-views/${$currentView.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldUpdate)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update view');
      }
      
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
    filters.update(f => [
      ...f, 
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'amount', operator: '=', value: '' }
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
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'amount', direction: 'asc' }
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
  
  // Function to fetch donations with pagination
  async function fetchDonationsData() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isLoadingDonations.set(true);
    donationsError.set(null);
    
    try {
      // Always use client-side for now since API endpoints aren't implemented
      useClientSideFiltering = true;
      const donationData = await fetchDonations($workspaceStore.currentWorkspace.id);
      donations.set(donationData || []);
      applyFiltersAndSorting();
      
      // Update pagination based on filtered results
      donationsPagination.setTotalRecords($filteredDonations.length);
      
      // Calculate donation stats
      const currentDonations = $filteredDonations;
      if (currentDonations && currentDonations.length > 0) {
        const totalAmount = currentDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
        const averageAmount = totalAmount / currentDonations.length;
        
        // Count unique donors
        const uniqueDonors = new Set();
        currentDonations.forEach(donation => {
          if (donation.contactId) {
            uniqueDonors.add(`contact_${donation.contactId}`);
          } else if (donation.businessId) {
            uniqueDonors.add(`business_${donation.businessId}`);
          }
        });
        
        donationStats.set({
          totalAmount,
          averageAmount,
          donorCount: uniqueDonors.size
        });
      } else {
        donationStats.set({
          totalAmount: 0,
          averageAmount: 0,
          donorCount: 0
        });
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      donationsError.set('Failed to load donations');
    } finally {
      isLoadingDonations.set(false);
    }
  }
  
  // Apply filters and sorting to donations (client-side)
  function applyFiltersAndSorting() {
    if (!useClientSideFiltering) return;
    
    let result = [...$donations];
    
    // Apply filters
    if ($filters && $filters.length > 0) {
      $filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value) {
          result = result.filter(donation => {
            const donationValue = donation[filter.field];
            if (donationValue === null || donationValue === undefined) return false;
            
            switch(filter.operator) {
              case '=':
                return String(donationValue).toLowerCase() === String(filter.value).toLowerCase();
              case '!=':
                return String(donationValue).toLowerCase() !== String(filter.value).toLowerCase();
              case 'contains':
                return String(donationValue).toLowerCase().includes(String(filter.value).toLowerCase());
              case 'startsWith':
                return String(donationValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
              case 'endsWith':
                return String(donationValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
              case '>':
                return parseFloat(donationValue) > parseFloat(filter.value);
              case '<':
                return parseFloat(donationValue) < parseFloat(filter.value);
              case '>=':
                return parseFloat(donationValue) >= parseFloat(filter.value);
              case '<=':
                return parseFloat(donationValue) <= parseFloat(filter.value);
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
      result = result.filter(donation => {
        // Helper function to safely check if a field includes the search query
        const fieldIncludes = (field) => {
          if (!field) return false;
          return String(field).toLowerCase().includes(query);
        };
        
        // Search in donation fields
        return (
          fieldIncludes(donation.amount) ||
          fieldIncludes(donation.status) ||
          fieldIncludes(donation.paymentType) ||
          fieldIncludes(donation.notes) ||
          fieldIncludes(donation.donorName)
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
          
          // Special handling for amount field
          if (sort.field === 'amount') {
            const numA = parseFloat(valueA);
            const numB = parseFloat(valueB);
            if (numA < numB) return sort.direction === 'asc' ? -1 : 1;
            if (numA > numB) return sort.direction === 'asc' ? 1 : -1;
            continue;
          }
          
          // Normal string comparison for other fields
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
    
    filteredDonations.set(result);
  }
  
  // Only fetch when workspace changes
  $: if ($workspaceStore.currentWorkspace) {
    fetchViews();
    fetchDonationsData();
  }
  
  // Debounced data refresh for other changes
  let refreshTimeout;
  function scheduleRefresh() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      if (useClientSideFiltering) {
        applyFiltersAndSorting();
        donationsPagination.setTotalRecords($filteredDonations.length);
      }
    }, 100);
  }
  
  // Watch for changes that should trigger filtering/sorting
  $: if ($searchQuery !== undefined || $filters !== undefined || $sorting !== undefined) {
    scheduleRefresh();
  }
</script>

<svelte:head>
  <title>Donations | Civics Lab</title>
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
    <DonationsViewNavbar 
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
      on:openDonationModal={handleOpenDonationModal}
    />
    
    <!-- Filter, sort, and search bar -->
    <DonationsFilterSortBar 
      isFilterPopoverOpen={$isFilterPopoverOpen}
      isSortPopoverOpen={$isSortPopoverOpen}
      filters={$filters}
      sorting={$sorting}
      searchQuery={$searchQuery}
      availableFields={$availableFields}
      currentView={$currentView}
      donationStats={$donationStats}
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
    
    <!-- Donations data grid with details sheet integrated -->
    <DonationsDataGrid 
      donations={$filteredDonations}
      isLoading={$isLoadingDonations}
      error={$donationsError}
      visibleColumns={$currentView ? Object.entries($currentView)
        .filter(([key, value]) => value === true && key !== 'id' && key !== 'viewName' && key !== 'workspaceId' && key !== 'filters' && key !== 'sorting' && key !== 'createdById' && key !== 'createdAt' && key !== 'updatedAt')
        .map(([key]) => key) : []}
      availableFields={$availableFields}
      currentPage={$donationsPagination.currentPage}
      totalPages={$donationsPagination.totalPages}
      totalRecords={$donationsPagination.totalRecords}
      pageSize={$donationsPagination.pageSize}
      on:addDonation={handleAddDonation}
      on:donationUpdated={handleDonationUpdated}
      on:pageChanged={handlePageChanged}
      on:pageSizeChanged={handlePageSizeChanged}
    />
    
    <!-- Modals for donation and view management -->
    <DonationsViewModals 
      isDonationModalOpen={$isDonationModalOpen}
      isCreateViewModalOpen={$isCreateViewModalOpen}
      isEditViewModalOpen={$isEditViewModalOpen}
      isDeleteViewModalOpen={$isDeleteViewModalOpen}
      newViewName={$newViewName}
      currentView={$currentView}
      on:closeDonationModal={handleCloseDonationModal}
      on:donationCreated={handleDonationCreated}
      on:createView={createView}
      on:updateView={updateView}
      on:deleteView={deleteView}
      on:closeCreateViewModal={() => isCreateViewModalOpen.set(false)}
      on:closeEditViewModal={() => isEditViewModalOpen.set(false)}
      on:closeDeleteViewModal={() => isDeleteViewModalOpen.set(false)}
    />
  {/if}
</div>
