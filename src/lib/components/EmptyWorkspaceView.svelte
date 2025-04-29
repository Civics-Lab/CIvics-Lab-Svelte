<!-- src/lib/components/EmptyWorkspaceView.svelte -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { createWorkspace } from '$lib/services/workspaceService';
  import LoadingSpinner from './LoadingSpinner.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let autoOpen = false; // If true, automatically open the form
  
  let workspaceName = writable('');
  let showForm = writable(false);
  let isSubmitting = writable(false);
  let error = writable('');
  let success = writable(false);
  
  onMount(() => {
    if (autoOpen) {
      showForm.set(true);
    }
  });
  
  function toggleForm() {
    showForm.update(value => !value);
  }
  
  async function handleSubmit() {
    if (!$workspaceName.trim()) {
      error.set('Workspace name is required');
      return;
    }
    
    // Reset states
    isSubmitting.set(true);
    error.set('');
    success.set(false);
    
    try {
      // Call API to create workspace
      const workspace = await createWorkspace($workspaceName.trim());
      
      // Set success state
      success.set(true);
      
      // Notify parent component
      dispatch('created', { workspace });
      
      // Reset form
      workspaceName.set('');
      showForm.set(false);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error creating workspace:', err);
      error.set(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      isSubmitting.set(false);
    }
  }
</script>

<div class="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto my-8">
  <div class="text-center mb-8">
    <h1 class="text-2xl font-bold mb-2">Welcome to Civics Lab!</h1>
    <p class="text-gray-600 text-lg">Get started by creating your first workspace</p>
  </div>
  
  {#if $success}
    <div class="bg-green-100 text-green-800 p-4 rounded-md mb-6 text-center">
      <p class="font-medium">Workspace created successfully!</p>
      <p class="mt-1">Redirecting...</p>
    </div>
  {:else if !$showForm}
    <div class="text-center mb-6">
      <button 
        on:click={toggleForm}
        class="px-6 py-3 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        Create Your First Workspace
      </button>
    </div>
    
    <div class="mt-8 border-t border-gray-200 pt-6">
      <h2 class="text-lg font-semibold mb-4">What is a workspace?</h2>
      <p class="text-gray-700 mb-4">
        A workspace is your dedicated environment in Civics Lab where you can manage contacts, 
        donations, and other resources for your organization or campaign.
      </p>
      <p class="text-gray-700">
        You can create multiple workspaces for different organizations or campaigns, 
        and easily switch between them.
      </p>
    </div>
  {:else}
    <form on:submit|preventDefault={handleSubmit} class="max-w-md mx-auto">
      <div class="mb-6">
        <label for="workspace-name" class="block text-sm font-medium mb-2">Workspace Name</label>
        <input 
          id="workspace-name"
          bind:value={$workspaceName}
          placeholder="Enter a name for your workspace"
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          disabled={$isSubmitting}
        />
        {#if $error}
          <p class="mt-2 text-sm text-red-600">{$error}</p>
        {/if}
      </div>
      
      <div class="flex items-center justify-between">
        <button 
          type="button" 
          on:click={toggleForm}
          class="text-gray-600 hover:underline"
          disabled={$isSubmitting}
        >
          Cancel
        </button>
        
        <button 
          type="submit"
          class="px-5 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          disabled={$isSubmitting}
        >
          {#if $isSubmitting}
            <div class="flex items-center">
              <LoadingSpinner size="sm" color="white" />
              <span class="ml-2">Creating...</span>
            </div>
          {:else}
            Create Workspace
          {/if}
        </button>
      </div>
    </form>
  {/if}
</div>
