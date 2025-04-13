<!-- src/routes/engage/settings/workspace/general/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toastStore } from '$lib/stores/toastStore';
  import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
  import { updateWorkspace, deleteWorkspace, uploadWorkspaceLogo, removeWorkspaceLogo } from '$lib/services/workspaceService';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // Form state
  const workspaceName = writable('');
  const isRenaming = writable(false);
  const isDeleting = writable(false);
  const showDeleteConfirm = writable(false);
  const deleteConfirmText = writable('');
  
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
      console.log(`Renaming workspace ${$workspaceStore.currentWorkspace.id} to "${$workspaceName.trim()}"`);
      const updatedWorkspace = await updateWorkspace($workspaceStore.currentWorkspace.id, {
        name: $workspaceName.trim()
      });
      
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