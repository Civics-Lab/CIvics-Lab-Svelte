<!-- src/routes/onboarding/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let data;
  
  let loading = true;
  let hasWorkspaces = false;
  let workspaceName = "";
  let error = "";
  let creatingWorkspace = false;
  
  onMount(async () => {
    try {
      // Check if user has workspaces
      const response = await fetch('/api/workspaces/user/has-workspaces');
      const result = await response.json();
      
      if (result.success) {
        hasWorkspaces = result.data.hasWorkspaces;
        
        // If user already has workspaces, redirect to app
        if (hasWorkspaces) {
          goto('/app');
        }
      } else {
        error = result.error || 'Failed to check workspace status';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  });
  
  async function createWorkspace() {
    if (!workspaceName.trim()) {
      error = "Workspace name is required";
      return;
    }
    
    error = "";
    creatingWorkspace = true;
    
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: workspaceName.trim() })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to app after successful workspace creation
        goto('/app');
      } else {
        error = result.error || 'Failed to create workspace';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      creatingWorkspace = false;
    }
  }
</script>

<svelte:head>
  <title>Get Started | Civics Lab</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
  <div class="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Welcome to Civics Lab!</h1>
      <p class="text-gray-600 mt-2">Let's get you set up with your own workspace.</p>
    </div>
    
    {#if loading}
      <div class="flex justify-center p-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
      </div>
    {:else}
      {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      {/if}
      
      <div class="mb-6">
        <label for="workspace-name" class="block text-sm font-medium text-gray-700 mb-1">
          Workspace Name
        </label>
        <input
          id="workspace-name"
          type="text"
          bind:value={workspaceName}
          placeholder="Enter your workspace name"
          class="w-full p-2 border rounded focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          required
        />
        <p class="text-sm text-gray-500 mt-1">
          This will be your main workspace where you'll manage your contacts, businesses, and donations.
        </p>
      </div>
      
      <button
        on:click={createWorkspace}
        disabled={creatingWorkspace || !workspaceName.trim()}
        class="w-full bg-slate-900 text-white p-3 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if creatingWorkspace}
          <span class="flex items-center justify-center">
            <span class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
            Creating...
          </span>
        {:else}
          Create Workspace
        {/if}
      </button>
    {/if}
  </div>
</div>
