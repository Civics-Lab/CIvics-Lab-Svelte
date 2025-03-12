<!-- src/lib/components/businesses/BusinessesViewNavbar.svelte -->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  
    // Props
    export let views = [];
    export let currentView = null;
    export let viewsLoading = false;
    export let viewsError = null;
    export let isViewSelectOpen = false;
    export let isViewSettingsOpen = false;
    export let availableFields = [];
    
    const dispatch = createEventDispatcher();
    
    // Event handlers
    function toggleViewSelect() {
      isViewSelectOpen = !isViewSelectOpen;
      // Close the settings menu if it's open
      if (isViewSelectOpen && isViewSettingsOpen) {
        isViewSettingsOpen = false;
      }
    }
    
    function toggleViewSettings() {
      isViewSettingsOpen = !isViewSettingsOpen;
      // Close the select menu if it's open
      if (isViewSettingsOpen && isViewSelectOpen) {
        isViewSelectOpen = false;
      }
    }
    
    function selectView(view) {
      dispatch('selectView', view);
      isViewSelectOpen = false;
    }
    
    function toggleField(fieldId) {
      dispatch('toggleField', fieldId);
    }
    
    function openCreateViewModal() {
      dispatch('openCreateViewModal');
      isViewSelectOpen = false;
    }
    
    function openEditViewModal() {
      dispatch('openEditViewModal');
      isViewSettingsOpen = false;
    }
    
    function openDeleteViewModal() {
      dispatch('openDeleteViewModal');
      isViewSettingsOpen = false;
    }
    
    function openBusinessModal() {
      dispatch('openBusinessModal');
    }
  </script>
  
  <div class="bg-slate-100 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
    <div class="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 mr-2" fill="none"