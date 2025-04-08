<!-- src/routes/app/admin/invites/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/auth/client';
  import { workspaceRoleEnum } from '$lib/db/drizzle';
  
  export let data;
  
  let email = '';
  let selectedRole = 'Basic User';
  let selectedWorkspaceId = '';
  let workspaces = [];
  let invites = [];
  let loading = true;
  let submitting = false;
  let error = '';
  let success = '';
  
  // Role options from the enum
  const roleOptions = workspaceRoleEnum.enumValues;
  
  onMount(async () => {
    await loadWorkspaces();
    loading = false;
  });
  
  async function loadWorkspaces() {
    try {
      const response = await fetch('/api/workspaces/user');
      const result = await response.json();
      
      if (result.success) {
        workspaces = result.data;
        
        // Set first workspace as default if available
        if (workspaces.length > 0) {
          selectedWorkspaceId = workspaces[0].workspace.id;
          await loadInvites(selectedWorkspaceId);
        }
      } else {
        error = result.error || 'Failed to load workspaces';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    }
  }
  
  async function loadInvites(workspaceId) {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`/api/invites/workspace/${workspaceId}`);
      const result = await response.json();
      
      if (result.success) {
        invites = result.data;
      } else {
        error = result.error || 'Failed to load invites';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    }
  }
  
  async function handleWorkspaceChange() {
    await loadInvites(selectedWorkspaceId);
  }
  
  async function sendInvite() {
    if (!email.trim()) {
      error = 'Email is required';
      return;
    }
    
    if (!selectedWorkspaceId) {
      error = 'Please select a workspace';
      return;
    }
    
    error = '';
    success = '';
    submitting = true;
    
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          workspaceId: selectedWorkspaceId,
          role: selectedRole
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        success = `Invite sent to ${email}`;
        email = '';
        // Reload invites to show the new one
        await loadInvites(selectedWorkspaceId);
      } else {
        error = result.error || 'Failed to send invite';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      submitting = false;
    }
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
  
  function getStatusClass(status) {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      case 'Expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>Manage Invites | Civics Lab</title>
</svelte:head>

<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Manage Workspace Invites</h1>
    <button 
      on:click={() => auth.logout()}
      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Sign Out
    </button>
  </div>
  
  {#if loading}
    <div class="flex justify-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900"></div>
    </div>
  {:else}
    {#if workspaces.length === 0}
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <p>You don't have any workspaces yet. Create a workspace to start inviting users.</p>
      </div>
    {:else}
      <!-- Workspace Selector -->
      <div class="mb-6 max-w-md">
        <label for="workspace" class="block text-sm font-medium text-gray-700 mb-1">
          Select Workspace
        </label>
        <select
          id="workspace"
          bind:value={selectedWorkspaceId}
          on:change={handleWorkspaceChange}
          class="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {#each workspaces as { workspace, role }}
            <option value={workspace.id}>{workspace.name}</option>
          {/each}
        </select>
      </div>
      
      <!-- Invite Form -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-lg font-medium mb-4">Invite New Users</h2>
        
        {#if error}
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            {error}
          </div>
        {/if}
        
        {#if success}
          <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
            {success}
          </div>
        {/if}
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="user@example.com"
              class="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              bind:value={selectedRole}
              class="block w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {#each roleOptions as role}
                <option value={role}>{role}</option>
              {/each}
            </select>
          </div>
          
          <div class="flex items-end">
            <button
              on:click={sendInvite}
              disabled={submitting || !email.trim() || !selectedWorkspaceId}
              class="w-full bg-slate-900 text-white p-2 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if submitting}
                <span class="flex items-center justify-center">
                  <span class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Sending...
                </span>
              {:else}
                Send Invite
              {/if}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Invites List -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium mb-4">Current Invites</h2>
        
        {#if invites.length === 0}
          <p class="text-gray-500 italic">No invites found for this workspace.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited On
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires On
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each invites as invite}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{invite.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{invite.role}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusClass(invite.status)}">
                        {invite.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.invitedAt)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.expiresAt)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
