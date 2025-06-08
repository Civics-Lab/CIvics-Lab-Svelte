<!-- src/routes/engage/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import { userStore } from '$lib/stores/userStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import Timeline from '$lib/components/shared/Timeline.svelte';
    import { fetchDashboardStats, type DashboardStats } from '$lib/services/dashboardService';
    import type { PageData } from './$types';
    
    export let data: PageData;
    $: ({ supabase } = data);
    
    let dashboardStats: DashboardStats = {
      totalContacts: 0,
      totalBusinesses: 0,
      totalDonations: 0,
      totalDonationAmount: 0
    };
    let isLoadingStats = false;
    
    // Function to load dashboard stats
    async function loadDashboardStats() {
      if (!$workspaceStore.currentWorkspace) return;
      
      isLoadingStats = true;
      try {
        dashboardStats = await fetchDashboardStats($workspaceStore.currentWorkspace.id);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        // Keep the default values on error
      } finally {
        isLoadingStats = false;
      }
    }
    
    // When page loads, ensure workspaces are loaded and select the first one if needed
    onMount(() => {
      const refreshAndSelect = async () => {
        // If no workspaces are loaded yet, refresh them
        if (!$workspaceStore.workspaces || $workspaceStore.workspaces.length === 0) {
          await workspaceStore.refreshWorkspaces();
        } 
        // If no workspace is selected but we have workspaces, select the first one
        else if (!$workspaceStore.currentWorkspace && $workspaceStore.workspaces.length > 0) {
          workspaceStore.setCurrentWorkspace($workspaceStore.workspaces[0].id);
        }
      };
      
      refreshAndSelect();
    });
    
    // Load stats whenever the current workspace changes
    $: if ($workspaceStore.currentWorkspace) {
      loadDashboardStats();
    }
</script>
  
<svelte:head>
  <title>Engagement Dashboard</title>
</svelte:head>
  
<div class="h-full w-full p-6 overflow-y-auto">
  {#if $workspaceStore.isLoading}
    <div class="flex justify-center items-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  {:else if !$workspaceStore.currentWorkspace}
    <div class="bg-white p-8 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4 text-gray-700">No Workspace Selected</h2>
      <p class="text-gray-600">
        Please select a workspace from the dropdown in the sidebar to continue.
      </p>
    </div>
  {:else}
    <div>
      <h1 class="text-2xl font-bold mb-2">Engagement Dashboard</h1>
      <p class="text-gray-600 mb-6">
        Welcome to {$workspaceStore.currentWorkspace.name}
      </p>
      
      <!-- Dashboard Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Stats Card: Contacts -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Contacts</p>
              {#if isLoadingStats}
                <div class="flex items-center mt-1">
                  <LoadingSpinner size="sm" />
                  <span class="ml-2 text-gray-500">Loading...</span>
                </div>
              {:else}
                <p class="text-2xl font-semibold">{dashboardStats.totalContacts.toLocaleString()}</p>
              {/if}
            </div>
            <div class="p-3 bg-blue-100 text-blue-600 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <a href="/app/contacts" class="block mt-4 text-sm font-medium text-blue-600 hover:underline">
            View all contacts
          </a>
        </div>
        
        <!-- Stats Card: Businesses -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Businesses</p>
              {#if isLoadingStats}
                <div class="flex items-center mt-1">
                  <LoadingSpinner size="sm" />
                  <span class="ml-2 text-gray-500">Loading...</span>
                </div>
              {:else}
                <p class="text-2xl font-semibold">{dashboardStats.totalBusinesses.toLocaleString()}</p>
              {/if}
            </div>
            <div class="p-3 bg-green-100 text-green-600 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <a href="/app/businesses" class="block mt-4 text-sm font-medium text-blue-600 hover:underline">
            View all businesses
          </a>
        </div>
        
        <!-- Stats Card: Donations -->
        <div class="bg-white p-6 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Donations</p>
              {#if isLoadingStats}
                <div class="flex items-center mt-1">
                  <LoadingSpinner size="sm" />
                  <span class="ml-2 text-gray-500">Loading...</span>
                </div>
              {:else}
                <div>
                  <p class="text-2xl font-semibold">${(dashboardStats.totalDonationAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p class="text-sm text-gray-500">{dashboardStats.totalDonations.toLocaleString()} donations</p>
                </div>
              {/if}
            </div>
            <div class="p-3 bg-purple-100 text-purple-600 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <a href="/app/donations" class="block mt-4 text-sm font-medium text-blue-600 hover:underline">
            View all donations
          </a>
        </div>
      </div>
      
      <!-- Recent Activity and Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Activity Timeline -->
        <Timeline limit={15} />
        
        <!-- Quick Actions -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Quick Actions</h2>
          <div class="grid grid-cols-2 gap-4">
            <a href="/app/contacts" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span class="text-sm font-medium">Add Contact</span>
            </a>
            
            <a href="/app/businesses" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span class="text-sm font-medium">Add Business</span>
            </a>
            
            <a href="/app/donations" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="text-sm font-medium">Record Donation</span>
            </a>
            
            <a href="/app/contacts/import" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span class="text-sm font-medium">Import Data</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
