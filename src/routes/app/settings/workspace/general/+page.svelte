<!-- src/routes/engage/settings/workspace/general/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { page } from '$app/stores';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { 
    updateWorkspace, 
    deleteWorkspace, 
    uploadWorkspaceLogo, 
    removeWorkspaceLogo, 
    updateWorkspaceStrict, 
    testApiConnectivity,
    updateWorkspaceDebug, 
    checkWorkspaceDebug, 
    updateWorkspaceSimple 
  } from '$lib/services/workspaceService';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // When page loads, validate current workspace
  onMount(async () => {
    if ($workspaceStore.currentWorkspace) {
      // Validate current workspace
      const isValid = await workspaceStore.validateWorkspaceId($workspaceStore.currentWorkspace.id);
      
      if (!isValid) {
        console.warn('Current workspace is invalid, refreshing workspaces');
        await workspaceStore.refreshWorkspaces();
      }
    }
  });
  
  // Form state
  const workspaceName = writable('');
  const isRenaming = writable(false);
  const isDeleting = writable(false);
  const showDeleteConfirm = writable(false);
  const deleteConfirmText = writable('');
  
  // Diagnostic states
  const isTesting = writable(false);
  const testResults = writable<any>(null);
  const errorText = writable<string | null>(null);
  
  // Logo state
  const logoFile = writable<File | null>(null);
  const logoPreview = writable<string | null>(null);
  const isUploadingLogo = writable(false);
  const isDeletingLogo = writable(false);
  
  // Update form when workspace changes
  $: if ($workspaceStore.currentWorkspace) {
    workspaceName.set($workspaceStore.currentWorkspace.name);
    
    // Set logo preview if exists
    if ($workspaceStore.currentWorkspace.logo) {
      logoPreview.set($workspaceStore.currentWorkspace.logo);
    } else {
      logoPreview.set(null);
    }
  }
  
  // Handle logo file selection
  function handleLogoSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file is an image
      if (!file.type.startsWith('image/')) {
        toastStore.error('Please select an image file');
        return;
      }
      
      // Store the file for upload
      logoFile.set(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          logoPreview.set(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }
  
  // Handle logo upload
  async function handleLogoUpload() {
    if (!$workspaceStore.currentWorkspace || !$logoFile) return;
    
    isUploadingLogo.set(true);
    
    try {
      console.log(`Uploading logo for workspace ${$workspaceStore.currentWorkspace.id}`);
      const logoUrl = await uploadWorkspaceLogo($workspaceStore.currentWorkspace.id, $logoFile);
      
      console.log('Logo upload successful, URL:', logoUrl);
      
      // Update the store with the new logo
      workspaceStore.updateCurrentWorkspace({ logo: logoUrl });
      
      logoFile.set(null); // Clear the file input
      toastStore.success('Logo uploaded successfully');
    } catch (err) {
      console.error('Error uploading logo:', err);
      toastStore.error(`Failed to upload logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      isUploadingLogo.set(false);
    }
  }
  
  // Handle logo removal
  async function handleLogoRemove() {
    if (!$workspaceStore.currentWorkspace || !$workspaceStore.currentWorkspace.logo) return;
    
    isDeletingLogo.set(true);
    
    try {
      console.log(`Removing logo for workspace ${$workspaceStore.currentWorkspace.id}`);
      await removeWorkspaceLogo($workspaceStore.currentWorkspace.id);
      
      console.log('Logo removal successful');
      
      // Update the store to remove the logo
      workspaceStore.updateCurrentWorkspace({ logo: null });
      
      logoPreview.set(null);
      toastStore.success('Logo removed successfully');
    } catch (err) {
      console.error('Error removing logo:', err);
      toastStore.error(`Failed to remove logo: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      isDeletingLogo.set(false);
    }
  }
  
  // Handle workspace rename
  async function handleRename() {
    if (!$workspaceStore.currentWorkspace || !$workspaceName.trim()) return;
    
    isRenaming.set(true);
    
    try {
      // Get the current workspace ID
      const workspaceId = $workspaceStore.currentWorkspace.id;
      
      console.log(`Renaming workspace ${workspaceId} to "${$workspaceName.trim()}"`); 
      
      // Use our new simple update method instead of the problematic one
      const updatedWorkspace = await updateWorkspaceSimple(
        workspaceId, 
        { name: $workspaceName.trim() }
      );
      
      console.log('Workspace update result:', updatedWorkspace);
      
      // Update the store with the updated workspace
      workspaceStore.updateCurrentWorkspace(updatedWorkspace);
      
      toastStore.success('Workspace renamed successfully');
    } catch (err) {
      console.error('Error renaming workspace:', err);
      toastStore.error(`Failed to rename workspace: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      isRenaming.set(false);
    }
  }
  
  // Show delete confirmation modal
  function initiateDelete() {
    showDeleteConfirm.set(true);
  }
  
  // Cancel delete
  function cancelDelete() {
    showDeleteConfirm.set(false);
    deleteConfirmText.set('');
  }
  
  // Confirm delete
  async function confirmDelete() {
    if (!$workspaceStore.currentWorkspace) return;
    
    if ($deleteConfirmText !== $workspaceStore.currentWorkspace.name) {
      toastStore.error('Workspace name does not match');
      return;
    }
    
    isDeleting.set(true);
    
    try {
      console.log(`Deleting workspace ${$workspaceStore.currentWorkspace.id}`);
      // Save workspace ID to reload a different one
      const currentWorkspaceId = $workspaceStore.currentWorkspace.id;
      
      // Delete the workspace
      await deleteWorkspace(currentWorkspaceId);
      
      console.log('Workspace deleted successfully, refreshing workspaces list');
      
      // Refresh workspaces
      await workspaceStore.refreshWorkspaces();
      
      toastStore.success('Workspace deleted successfully');
      showDeleteConfirm.set(false);
    } catch (err) {
      console.error('Error deleting workspace:', err);
      toastStore.error(`Failed to delete workspace: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      isDeleting.set(false);
    }
  }
  
  // Test API connectivity
  async function testApi() {
    isTesting.set(true);
    errorText.set(null);
    testResults.set(null);
    
    try {
      const results = await testApiConnectivity();
      console.log('API test results:', results);
      testResults.set(results);
    } catch (err) {
      console.error('API test error:', err);
      errorText.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isTesting.set(false);
    }
  }
  
  // Test the debug API
  async function testDebugApi() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isTesting.set(true);
    errorText.set(null);
    testResults.set(null);
    
    try {
      // First, check if the workspace exists using the debug endpoint
      console.log('Testing debug API check for workspace');
      const checkResult = await checkWorkspaceDebug($workspaceStore.currentWorkspace.id);
      
      // Then try to update the workspace
      console.log('Testing debug API update for workspace');
      const newName = `Debug Test ${Date.now().toString().slice(-4)}`;
      const updateResult = await updateWorkspaceDebug(
        $workspaceStore.currentWorkspace.id,
        { name: newName }
      );
      
      // If successful, update the store
      if (updateResult) {
        workspaceStore.updateCurrentWorkspace(updateResult);
        console.log('Updated workspace via debug API:', updateResult);
      }
      
      // Set test results
      testResults.set({
        checkResult,
        updateResult,
        workspaceId: $workspaceStore.currentWorkspace.id,
        newName
      });
    } catch (err) {
      console.error('Debug API test error:', err);
      errorText.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isTesting.set(false);
    }
  }
  
  // Test route parameters to diagnose dynamic route issues
  async function testRouteParameters() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isTesting.set(true);
    errorText.set(null);
    testResults.set(null);
    
    const results: Record<string, any> = {};
    const workspaceId = $workspaceStore.currentWorkspace.id;
    const timestamp = Date.now();
    
    try {
      // Test the /api/test-workspaces endpoint with ID parameter
      console.log('Testing test-workspaces with ID parameter');
      const testResponse = await fetch(`/api/test-workspaces/${workspaceId}`);
      results.testWorkspacesEndpoint = {
        status: testResponse.status,
        data: testResponse.ok ? await testResponse.json() : 'Error'
      };
      
      // Test the test-id endpoint
      console.log('Testing test-id endpoint');
      const testIdResponse = await fetch('/api/workspaces/test-id');
      results.testIdEndpoint = {
        status: testIdResponse.status,
        data: testIdResponse.ok ? await testIdResponse.json() : 'Error'
      };
      
      // Test the workspaces API with a specific ID
      console.log('Testing workspaces API with specific ID');
      const specificResponse = await fetch(`/api/workspaces/${workspaceId}`);
      results.specificWorkspace = {
        status: specificResponse.status,
        data: specificResponse.ok ? await specificResponse.json() : 'Error'
      };
      
      // Test PATCH on test-workspaces endpoint
      console.log('Testing PATCH on test-workspaces endpoint');
      const testPatchResponse = await fetch(`/api/test-workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: `Test ${timestamp}` })
      });
      results.testPatch = {
        status: testPatchResponse.status,
        data: testPatchResponse.ok ? await testPatchResponse.json() : 'Error'
      };
      
      // Set test results
      testResults.set({
        routeTesting: results,
        timestamp,
        workspaceId
      });
    } catch (err) {
      console.error('Route parameter test error:', err);
      errorText.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isTesting.set(false);
    }
  }
  
  // Test SvelteKit route patterns
  async function testRoutePatterns() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isTesting.set(true);
    errorText.set(null);
    testResults.set(null);
    
    const results: Record<string, any> = {};
    const workspaceId = $workspaceStore.currentWorkspace.id;
    const timestamp = Date.now();
    
    try {
      // First test the specific test endpoint
      console.log('Testing workspaces test endpoint');
      const testResponse = await fetch('/api/workspaces/test');
      results.testEndpoint = {
        status: testResponse.status,
        data: testResponse.ok ? await testResponse.json() : 'Error'
      };
      
      // Test with a random string ID
      const randomId = `test-${timestamp}`;
      const randomResponse = await fetch(`/api/workspaces/${randomId}`);
      results.randomIdTest = {
        status: randomResponse.status,
        data: randomResponse.ok ? await randomResponse.json() : 'Error',
        id: randomId
      };
      
      // Test with the actual workspace ID
      const workspaceResponse = await fetch(`/api/workspaces/${workspaceId}`);
      results.workspaceIdTest = {
        status: workspaceResponse.status,
        data: workspaceResponse.ok ? await workspaceResponse.json() : 'Error',
        id: workspaceId
      };
      
      // Test update with a PATCH request
      const patchBody = { name: `Route Test ${timestamp}` };
      const patchResponse = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Route-Test': 'true'
        },
        body: JSON.stringify(patchBody)
      });
      results.patchTest = {
        status: patchResponse.status,
        data: patchResponse.ok ? await patchResponse.json() : 'Error',
        body: patchBody
      };
      
      // Set test results
      testResults.set({
        results,
        timestamp,
        workspaceId
      });
    } catch (err) {
      console.error('Route pattern test error:', err);
      errorText.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isTesting.set(false);
    }
  }
  
  // Test workspace API endpoints
  async function testWorkspaceEndpoints() {
    isTesting.set(true);
    errorText.set(null);
    testResults.set(null);
    
    try {
      // Test the specific test endpoint
      console.log('Testing workspaces test endpoint');
      const testResponse = await fetch('/api/workspaces/test');
      console.log('Workspaces test endpoint status:', testResponse.status);
      const testData = await testResponse.json();
      console.log('Workspaces test endpoint data:', testData);
      
      // Try a direct test with a random ID
      const randomId = `test-${Date.now()}`;
      const directResponse = await fetch(`/api/workspaces/${randomId}`);
      console.log('Direct test endpoint status:', directResponse.status);
      let directData;
      try {
        directData = await directResponse.json();
        console.log('Direct test endpoint data:', directData);
      } catch (e) {
        console.error('Error parsing direct test response:', e);
        directData = { error: 'Failed to parse response' };
      }
      
      // If we have a current workspace, try with that ID too
      let workspaceTestData = null;
      if ($workspaceStore.currentWorkspace) {
        const workspaceTestResponse = await fetch(`/api/workspaces/${$workspaceStore.currentWorkspace.id}`);
        console.log('Workspace ID test status:', workspaceTestResponse.status);
        try {
          workspaceTestData = await workspaceTestResponse.json();
          console.log('Workspace ID test data:', workspaceTestData);
        } catch (e) {
          console.error('Error parsing workspace ID test response:', e);
          workspaceTestData = { error: 'Failed to parse response' };
        }
      }
      
      // Set the test results
      testResults.set({
        testEndpoint: testData,
        directTest: directData,
        workspaceTest: workspaceTestData,
        currentWorkspaceId: $workspaceStore.currentWorkspace?.id
      });
    } catch (err) {
      console.error('Endpoint test error:', err);
      errorText.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isTesting.set(false);
    }
  }
  
  // Test the simple update API
  async function testSimpleUpdate() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isTesting.set(true);
    errorText.set(null);
    testResults.set(null);
    
    try {
      // Generate a test name with timestamp
      const testName = `Simple API Test ${Date.now().toString().slice(-4)}`;
      
      // Try using the simple update API
      console.log(`Testing simple update API for workspace ${$workspaceStore.currentWorkspace.id} with name "${testName}"`);
      
      const updatedWorkspace = await updateWorkspaceSimple(
        $workspaceStore.currentWorkspace.id,
        { name: testName }
      );
      
      console.log('Simple update API response:', updatedWorkspace);
      
      // If successful, update the workspace in the store
      if (updatedWorkspace) {
        workspaceStore.updateCurrentWorkspace(updatedWorkspace);
        console.log('Updated workspace in store:', updatedWorkspace);
      }
      
      // Set test results
      testResults.set({
        success: true,
        workspace: updatedWorkspace,
        testName: testName,
        workspaceId: $workspaceStore.currentWorkspace.id,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Simple API test error:', err);
      errorText.set(err instanceof Error ? err.message : 'Unknown error');
      
      testResults.set({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        workspaceId: $workspaceStore.currentWorkspace.id,
        timestamp: new Date().toISOString()
      });
    } finally {
      isTesting.set(false);
    }
  }
  
  // Test direct API call for workspace ID
  async function testWorkspaceIdApi() {
    if (!$workspaceStore.currentWorkspace) return;
    
    isTesting.set(true);
    errorText.set(null);
    testResults.set(null);
    
    try {
      // Check if the echo endpoint works first
      const echoId = $workspaceStore.currentWorkspace.id;
      console.log(`Testing echo endpoint with ID ${echoId}`);
      const echoResponse = await fetch(`/api/echo/${echoId}`);
      console.log('Echo ID response status:', echoResponse.status);
      let echoData;
      try {
        echoData = await echoResponse.json();
        console.log('Echo ID response data:', echoData);
      } catch (e) {
        console.error('Error parsing echo response:', e);
        echoData = { error: 'Failed to parse response' };
      }
      
      // Test GET for workspace
      console.log(`Testing GET for workspace ID ${$workspaceStore.currentWorkspace.id}`);
      const getResponse = await fetch(`/api/workspaces/${$workspaceStore.currentWorkspace.id}`);
      console.log('GET workspace ID response status:', getResponse.status);
      let getData;
      try {
        getData = await getResponse.json();
        console.log('GET workspace ID response data:', getData);
      } catch (e) {
        console.error('Error parsing GET response:', e);
        getData = { error: 'Failed to parse response' };
      }
      
      // Try direct DB check (using check endpoint)
      console.log(`Testing check endpoint for workspace ID ${$workspaceStore.currentWorkspace.id}`);
      const checkResponse = await fetch(`/api/workspaces/check?id=${$workspaceStore.currentWorkspace.id}`);
      console.log('Check endpoint response status:', checkResponse.status);
      let checkData;
      try {
        checkData = await checkResponse.json();
        console.log('Check endpoint response data:', checkData);
      } catch (e) {
        console.error('Error parsing check response:', e);
        checkData = { error: 'Failed to parse response' };
      }
      
      // Test PATCH directly
      console.log(`Testing PATCH for workspace ID ${$workspaceStore.currentWorkspace.id}`);
      const testName = `${$workspaceStore.currentWorkspace.name} - test-${Date.now().toString().slice(-4)}`;
      const patchResponse = await fetch(`/api/workspaces/${$workspaceStore.currentWorkspace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Info': 'testWorkspaceIdApi'
        },
        body: JSON.stringify({ name: testName })
      });
      console.log('PATCH workspace ID response status:', patchResponse.status);
      let patchData;
      try {
        patchData = await patchResponse.json();
        console.log('PATCH workspace ID response data:', patchData);
        
        // If the update was successful, update the store
        if (patchResponse.ok && patchData.workspace) {
          workspaceStore.updateCurrentWorkspace(patchData.workspace);
          console.log('Updated workspace in store:', patchData.workspace);
        }
      } catch (e) {
        console.error('Error parsing PATCH response:', e);
        patchData = { error: 'Failed to parse response' };
      }
      
      testResults.set({
        get: getData,
        patch: patchData,
        check: checkData,
        echo: echoData,
        workspaceId: $workspaceStore.currentWorkspace.id,
        baseUrl: $page.url.origin,
        testName
      });
    } catch (err) {
      console.error('Workspace ID API test error:', err);
      errorText.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isTesting.set(false);
    }
  }
</script>

<svelte:head>
  <title>Workspace Settings | Engage</title>
</svelte:head>

<div class="p-6">
  <h2 class="text-xl font-bold mb-6">Workspace Settings</h2>
  
  <!-- Workspace Logo Section -->
  <div class="mb-10 border-b pb-6">
    <h3 class="text-lg font-medium mb-4">Workspace Logo</h3>
    <div class="max-w-md">
      <!-- Logo Preview -->
      <div class="mb-4">
        {#if $logoPreview}
          <div class="relative w-24 h-24 mb-2">
            <img 
              src={$logoPreview} 
              alt="Workspace Logo" 
              class="w-24 h-24 object-contain border rounded-md"
            />
          </div>
          <button
            type="button"
            class="text-red-600 hover:text-red-800 text-sm mt-1"
            on:click={handleLogoRemove}
            disabled={$isDeletingLogo}
          >
            {#if $isDeletingLogo}
              <div class="flex items-center">
                <LoadingSpinner size="sm" color="red" />
                <span class="ml-2">Removing...</span>
              </div>
            {:else}
              Remove Logo
            {/if}
          </button>
        {:else}
          <div class="w-24 h-24 border rounded-md flex items-center justify-center mb-2 bg-gray-50">
            <span class="text-gray-400">No logo</span>
          </div>
        {/if}
      </div>
      
      <!-- Logo Upload -->
      <div class="mb-4">
        <label for="logo-upload" class="block text-sm font-medium text-gray-700 mb-1">
          Upload a Logo
        </label>
        <div class="flex items-center">
          <input
            type="file"
            id="logo-upload"
            class="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-teal-50 file:text-teal-700
              hover:file:bg-teal-100"
            accept="image/*"
            on:change={handleLogoSelect}
            disabled={$isUploadingLogo}
          />
          {#if $logoFile}
            <button
              type="button"
              class="ml-3 px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              on:click={handleLogoUpload}
              disabled={$isUploadingLogo || !$logoFile}
            >
              {#if $isUploadingLogo}
                <div class="flex items-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span class="ml-2">Uploading...</span>
                </div>
              {:else}
                Upload
              {/if}
            </button>
          {/if}
        </div>
        <p class="text-xs text-gray-500 mt-1">Recommended size: 256x256 pixels</p>
      </div>
    </div>
  </div>
  
  <!-- Workspace Name Form -->
  <div class="mb-10 border-b pb-6">
    <h3 class="text-lg font-medium mb-4">Workspace Name</h3>
    <div class="max-w-md">
      <div class="mb-4">
        <label for="workspace-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          id="workspace-name"
          type="text"
          bind:value={$workspaceName}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
          disabled={$isRenaming}
        />
      </div>
      <button
        type="button"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
        on:click={handleRename}
        disabled={$isRenaming || !$workspaceName || !$workspaceStore.currentWorkspace}
      >
        {#if $isRenaming}
          <div class="flex items-center">
            <LoadingSpinner size="sm" color="white" />
            <span class="ml-2">Saving...</span>
          </div>
        {:else}
          Rename Workspace
        {/if}
      </button>
    </div>
  </div>
  
  <!-- API Diagnostic Tools -->
  <div class="mb-10 border-b pb-6">
    <h3 class="text-lg font-medium mb-4">API Diagnostics</h3>
    <div class="max-w-md">
      <div class="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          on:click={testApi}
          disabled={$isTesting}
        >
          {#if $isTesting}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="gray" />
              <span class="ml-2">Testing API...</span>
            </div>
          {:else}
            Test API Connectivity
          {/if}
        </button>
        
        <button
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          on:click={testWorkspaceIdApi}
          disabled={$isTesting || !$workspaceStore.currentWorkspace}
        >
          {#if $isTesting}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="gray" />
              <span class="ml-2">Testing...</span>
            </div>
          {:else}
            Test Workspace ID API
          {/if}
        </button>
        
        <button
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          on:click={() => {
            if (!$workspaceStore.currentWorkspace) return;
            workspaceName.set(`Test Rename ${Date.now().toString().slice(-4)}`);
            handleRename();
          }}
          disabled={$isRenaming || !$workspaceStore.currentWorkspace}
        >
          {#if $isRenaming}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="gray" />
              <span class="ml-2">Renaming...</span>
            </div>
          {:else}
            Quick Rename Test
          {/if}
        </button>
        
        <button
          type="button"
          class="px-4 py-2 border border-orange-300 bg-orange-50 rounded-md shadow-sm text-sm font-medium text-orange-700 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          on:click={testRoutePatterns}
          disabled={$isTesting}
        >
          {#if $isTesting}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="orange" />
              <span class="ml-2">Testing...</span>
            </div>
          {:else}
            Test Route Patterns
          {/if}
        </button>
        
        <button
          type="button"
          class="px-4 py-2 border border-green-300 bg-green-50 rounded-md shadow-sm text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          on:click={testDebugApi}
          disabled={$isTesting || !$workspaceStore.currentWorkspace}
        >
          {#if $isTesting}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="green" />
              <span class="ml-2">Testing Debug API...</span>
            </div>
          {:else}
            Test Debug API
          {/if}
        </button>
        
        <button
          type="button"
          class="px-4 py-2 border border-blue-300 bg-blue-50 rounded-md shadow-sm text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          on:click={testSimpleUpdate}
          disabled={$isTesting || !$workspaceStore.currentWorkspace}
        >
          {#if $isTesting}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="blue" />
              <span class="ml-2">Testing Simple API...</span>
            </div>
          {:else}
            Test Simple API
          {/if}
        </button>
      </div>
      
      {#if $errorText}
        <div class="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
          <p class="text-red-700">{$errorText}</p>
        </div>
      {/if}
      
      {#if $testResults}
        <div class="bg-gray-50 border border-gray-200 p-4 rounded-md mb-4 overflow-x-auto">
          <h4 class="font-medium mb-2">Test Results:</h4>
          <pre class="text-xs">{JSON.stringify($testResults, null, 2)}</pre>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Danger Zone -->
  <div class="mb-6">
    <h3 class="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
    
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex justify-between items-center">
        <div>
          <h4 class="text-base font-medium text-red-800">Delete this workspace</h4>
          <p class="text-sm text-red-700 mt-1">
            Permanently delete this workspace and all of its data. This action cannot be undone.
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          on:click={initiateDelete}
        >
          Delete Workspace
        </button>
      </div>
    </div>
  </div>
  
  <!-- Delete Confirmation Modal -->
  {#if $showDeleteConfirm}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        class="bg-white rounded-lg shadow-xl max-w-md w-full" 
        on:click|stopPropagation 
        on:keydown|stopPropagation
      >
        <div class="p-6">
          <h2 class="text-xl font-semibold text-red-600 mb-4">Delete Workspace?</h2>
          <p class="mb-4">
            This action cannot be undone. This will permanently delete the
            <strong>{$workspaceStore.currentWorkspace?.name}</strong> workspace and all of its data.
          </p>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Please type <strong>{$workspaceStore.currentWorkspace?.name}</strong> to confirm
            </label>
            <input
              type="text"
              bind:value={$deleteConfirmText}
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              placeholder="Type workspace name here"
            />
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
              on:click={cancelDelete}
              disabled={$isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              on:click={confirmDelete}
              disabled={$isDeleting || $deleteConfirmText !== $workspaceStore.currentWorkspace?.name}
            >
              {#if $isDeleting}
                <div class="flex items-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span class="ml-2">Deleting...</span>
                </div>
              {:else}
                Delete Workspace
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
