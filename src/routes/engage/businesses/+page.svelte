<!-- src/routes/engage/businesses/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import type { PageData } from './$types';
  
  // Import components
  import BusinessesViewNavbar from '$lib/components/businesses/BusinessesViewNavbar.svelte';
  import BusinessesFilterSortBar from '$lib/components/businesses/BusinessesFilterSortBar.svelte';
  import BusinessesDataGrid from '$lib/components/businesses/BusinessesDataGrid.svelte';
  import BusinessesViewModals from '$lib/components/businesses/BusinessesViewModals.svelte';
  
  export let data: PageData;
  
  // State for modals
  const isBusinessModalOpen = writable(false);
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
    { id: 'business_name', label: 'Business Name' },
    { id: 'addresses', label: 'Address' },
    { id: 'phone_numbers', label: 'Phone' },
    { id: 'social_media_accounts', label: 'Social Media' },
    { id: 'employees', label: 'Employees' },
    { id: 'tags', label: 'Tags' }
  ]);
  
  // Filters state
  const filters = writable<any[]>([]);
  
  // Sort state
  const sorting = writable<any[]>([]);
  
  // Search state
  const searchQuery = writable('');
  
  // Businesses data
  const businesses = writable<any[]>([]);
  const filteredBusinesses = writable<any[]>([]);
  const isLoadingBusinesses = writable(false);
  const businessesError = writable<string | null>(null);
  
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
  
  function handleOpenBusinessModal() {
    isBusinessModalOpen.set(true);
  }
  
  function handleCloseBusinessModal() {
    isBusinessModalOpen.set(false);
  }
  
  function handleBusinessCreated() {
    fetchBusinesses();
  }
  
  function handleBusinessUpdated() {
    fetchBusinesses();
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
  
  function handleAddBusiness() {
    isBusinessModalOpen.set(true);
  }
  
  // Fetch views for the current workspace
  async function fetchViews(selectViewId = null) {
    if (!$workspaceStore.currentWorkspace) return;
    
    viewsLoading.set(true);
    viewsError.set(null);
    
    try {
      const { data: fetchedViews, error } = await data.supabase
        .from('business_views')
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
          ? localStorage.getItem('currentBusinessViewId') 
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
      // Create a default view with only the fields that exist in the database schema
      const defaultView = {
        view_name: 'Default View',
        workspace_id: $workspaceStore.currentWorkspace.id,
        business_name: true,
        addresses: true,
        phone_numbers: true,
        social_media_accounts: false,
        employees: false,
        // Remove tags as it doesn't exist in the table
        filters: [],
        sorting: []
      };
      
      const { data: newView, error } = await data.supabase
        .from('business_views')
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
      // Create the view with only fields that exist in the table schema
      const newView = {
        view_name: viewName.trim(),
        workspace_id: $workspaceStore.currentWorkspace.id,
        business_name: true,
        addresses: true,
        phone_numbers: true,
        social_media_accounts: true,
        employees: true,
        // Remove tags as it doesn't exist in the table
        filters: [],
        sorting: []
      };
      
      const { data: createdView, error } = await data.supabase
        .from('business_views')
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
  async function updateView(event = null) {
    if (!$currentView) return;
    
    try {
      let updatedView = { ...$currentView };
      
      // If editing the name (from event or from modal)
      if (event && typeof event.detail === 'string' && event.detail.trim()) {
        updatedView.view_name = event.detail.trim();
      } else if ($isEditViewModalOpen && $newViewName.trim()) {
        updatedView.view_name = $newViewName.trim();
      }
      
      // Update filters and sorting
      updatedView.filters = $filters;
      updatedView.sorting = $sorting;
      
      console.log('Updating view with:', updatedView);
      
      const { error } = await data.supabase
        .from('business_views')
        .update(updatedView)
        .eq('id', $currentView.id);
      
      if (error) throw error;
      
      // Update the view in the list
      views.update(v => 
        v.map(view => view.id === $currentView.id 
          ? updatedView 
          : view
        )
      );
      
      // Update current view
      currentView.set(updatedView);
      
      // Refetch views to ensure list is updated
      await fetchViews($currentView.id);
      
      // Close the edit modal if it's open
      if ($isEditViewModalOpen) {
        isEditViewModalOpen.set(false);
        newViewName.set('');
        toastStore.success('View updated successfully');
      }
      
    } catch (error) {
      console.error('Error updating view:', error);
      toastStore.error('Failed to update view');
    }
  }
  
  // Delete a view
  async function deleteView() {
    if (!$currentView) return;
    
    try {
      const { error } = await data.supabase
        .from('business_views')
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
        .from('business_views')
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
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'business_name', operator: '=', value: '' }
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
      { field: Object.keys($currentView).find(key => $currentView[key] === true) || 'business_name', direction: 'asc' }
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
  
  // Function to fetch businesses
  async function fetchBusinesses() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isLoadingBusinesses.set(true);
    businessesError.set(null);
    
    try {
      // Fetch businesses for the current workspace
      const { data: businessData, error } = await data.supabase
        .from('businesses')
        .select('*')
        .eq('workspace_id', $workspaceStore.currentWorkspace.id);
      
      if (error) throw error;
      
      // Enhanced business data with addresses, phones, etc.
      const enhancedBusinesses = await Promise.all((businessData || []).map(async (business) => {
        try {
          // Get phone numbers
          const { data: phones } = await data.supabase
            .from('business_phone_numbers')
            .select('*')
            .eq('business_id', business.id);
          
          // Get addresses
          const { data: addresses } = await data.supabase
            .from('business_full_addresses')
            .select('*')
            .eq('business_id', business.id);
          
          // Get social media accounts
          const { data: socialMedia } = await data.supabase
            .from('business_social_media_accounts')
            .select('*')
            .eq('business_id', business.id);
          
          // Get employees - which are contacts from the same workspace
          const { data: employeeRelations } = await data.supabase
            .from('business_employees')
            .select(`
              id,
              status,
              contact_id,
              contacts:contact_id (id, first_name, last_name)
            `)
            .eq('business_id', business.id);
          
          // Get tags
          const { data: tags } = await data.supabase
            .from('business_tags')
            .select('*')
            .eq('business_id', business.id);
          
          // Return enhanced business
          return {
            ...business,
            phone_numbers: phones || [],
            addresses: addresses || [],
            social_media_accounts: socialMedia || [],
            employees: employeeRelations || [],
            tags: tags || []
          };
        } catch (err) {
          console.error('Error fetching business details:', err);
          return business;
        }
      }));
      
      businesses.set(enhancedBusinesses || []);
      applyFiltersAndSorting();
    } catch (error) {
      console.error('Error fetching businesses:', error);
      businessesError.set('Failed to load businesses');
    } finally {
      isLoadingBusinesses.set(false);
    }
  }
  
  // Apply filters and sorting to businesses
  function applyFiltersAndSorting() {
    let result = [...$businesses];
    
    // Apply filters
    if ($filters && $filters.length > 0) {
      $filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value) {
          result = result.filter(business => {
            // Handle different field types appropriately
            const businessValue = business[filter.field];
            
            // Skip if the value is not available
            if (businessValue === null || businessValue === undefined) return false;
            
            // Handle array fields (like addresses, phone_numbers)
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
        // Search in business name
        if (business.business_name && business.business_name.toLowerCase().includes(query)) {
          return true;
        }
        
        // Search in addresses
        if (Array.isArray(business.addresses) && business.addresses.some(address => 
          Object.values(address).some(val => val && String(val).toLowerCase().includes(query))
        )) {
          return true;
        }
        
        // Search in phone numbers
        if (Array.isArray(business.phone_numbers) && business.phone_numbers.some(phone => 
          phone.phone_number && phone.phone_number.toLowerCase().includes(query)
        )) {
          return true;
        }
        
        // Search in tags
        if (Array.isArray(business.tags) && business.tags.some(tag => 
          tag.tag && tag.tag.toLowerCase().includes(query)
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
          
          let valueA = a[sort.field];
          let valueB = b[sort.field];
          
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
      fetchBusinesses();
    }
  });
  
  // Fetch data when workspace changes
  $: if ($workspaceStore.currentWorkspace) {
    fetchViews();
    fetchBusinesses();
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
    />
    
    <!-- Filter, sort, and search bar -->
    <BusinessesFilterSortBar 
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
    
    <!-- Businesses data grid with details sheet integrated -->
    <BusinessesDataGrid 
      businesses={$filteredBusinesses}
      isLoading={$isLoadingBusinesses}
      error={$businessesError}
      visibleColumns={$currentView ? Object.entries($currentView)
        .filter(([key, value]) => value === true && !key.startsWith('_'))
        .map(([key]) => key) : []}
      availableFields={$availableFields}
      supabase={data.supabase}
      on:addBusiness={handleAddBusiness}
      on:businessUpdated={handleBusinessUpdated}
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
  {/if}
</div>