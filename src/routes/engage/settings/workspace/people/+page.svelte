<!-- src/routes/engage/settings/workspace/people/+page.svelte -->
<script lang="ts">
    import { enhance } from '$app/forms';
    import { userStore } from '$lib/stores/userStore';
    import { toastStore } from '$lib/stores/toastStore';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { PageData, ActionData } from './$types';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    export let data: PageData;
    export let form: ActionData;
    
    $: members = data.members || [];
    $: pendingInvites = data.pendingInvites || [];
    $: workspaceRoles = data.workspaceRoles || [];
    $: noWorkspaceSelected = data.noWorkspaceSelected || false;
    $: noWorkspaceAccess = data.noWorkspaceAccess || false;
    // Removed tableNotReady check
    
    // State for invite form
    let showInviteForm = false;
    let inviteEmail = '';
    let inviteRole = 'Basic User';
    let isInviting = false;
    let inviteLink = '';
    
    // Handle action responses
    $: if (form?.success) {
      toastStore.success(form.message);
      
      // Store the invite link if provided
      if (form.inviteLink) {
        inviteLink = form.inviteLink;
      }
      
      // Reset invite form if it was a successful invite
      if (form.message === 'Invitation sent' || form.message === 'User added to workspace') {
        inviteEmail = '';
        showInviteForm = false;
      }
    } else if (form?.error) {
      toastStore.error(form.error);
    }
    
    // Toggle invite form
    function toggleInviteForm() {
      showInviteForm = !showInviteForm;
      if (!showInviteForm) {
        // Reset form when closing
        inviteEmail = '';
        inviteRole = 'Basic User';
        inviteLink = '';
      }
    }
    
    // Copy invite link to clipboard
    function copyInviteLink() {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          toastStore.success('Invite link copied to clipboard');
        })
        .catch((err) => {
          console.error('Could not copy text: ', err);
          toastStore.error('Failed to copy invite link');
        });
    }
    
    // Check if the member is the current user
    function isCurrentUser(userId: string) {
      return userId === $userStore.user?.id;
    }
    
    // Format date
    function formatDate(dateStr: string) {
      return new Date(dateStr).toLocaleDateString();
    }
    
    // Submit role update form when value changes
    function handleRoleChange(event: Event) {
      const form = (event.target as HTMLSelectElement).closest('form');
      if (form) form.submit();
    }
    
    // Navigate to the workspaces page
    function navigateToWorkspaces() {
      goto('/engage/settings/workspace/general');
    }
    
    // On mount, ensure we have a workspace ID
    onMount(async () => {
      // Check if we have a workspace ID in the store
      const currentWorkspace = $workspaceStore.currentWorkspace;
      
      if (!currentWorkspace && $workspaceStore.workspaces.length > 0) {
        // Set the first workspace as active
        await workspaceStore.setCurrentWorkspace($workspaceStore.workspaces[0].id);
        
        // Wait for the current workspace to be synced to the server
        setTimeout(() => {
          // Force a reload of the page to use the new workspace
          window.location.reload();
        }, 500);
      } else if (currentWorkspace && noWorkspaceSelected) {
        // We have a workspace in the store but the server doesn't know about it
        // This could happen if the cookie wasn't set properly
        console.log('Workspace selected in client but not in server, syncing...');
        
        try {
          // Sync the workspace with the server
          await fetch('/api/workspaces/set-current', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workspaceId: currentWorkspace.id })
          });
          
          // Reload the page to use the newly set workspace
          window.location.reload();
        } catch (error) {
          console.error('Failed to sync workspace with server:', error);
        }
      }
    });
</script>
  
<svelte:head>
  <title>Workspace Members | Engage</title>
</svelte:head>
  
<div class="p-6">
  {#if noWorkspaceSelected}
    <div class="bg-yellow-50 p-8 rounded-lg border border-yellow-200 text-center">
      <svg class="w-16 h-16 mx-auto text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <h2 class="text-xl font-bold text-yellow-800 mb-2">No Workspace Selected</h2>
      <p class="text-yellow-700 mb-4">Please select a workspace to manage members and invitations.</p>
      <button 
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        on:click={navigateToWorkspaces}
      >
        Select a Workspace
      </button>
    </div>
  {:else if noWorkspaceAccess}
    <div class="bg-red-50 p-8 rounded-lg border border-red-200 text-center">
      <svg class="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <h2 class="text-xl font-bold text-red-800 mb-2">No Access to This Workspace</h2>
      <p class="text-red-700 mb-4">You don't have permission to access this workspace.</p>
      <button 
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        on:click={navigateToWorkspaces}
      >
        Go to Available Workspaces
      </button>
    </div>
  {:else}
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">Workspace Members</h2>
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        on:click={toggleInviteForm}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Add Member
      </button>
    </div>
      
      <!-- Current Workspace Info -->
      {#if $workspaceStore.currentWorkspace}
        <div class="mb-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-blue-700">
            Managing members for workspace: <strong>{$workspaceStore.currentWorkspace.name}</strong>
          </span>
        </div>
      {/if}
      
      <!-- Invite User Form -->
      {#if showInviteForm}
        <div class="bg-gray-50 p-6 rounded-lg border mb-6">
          <h3 class="text-lg font-medium mb-4">Invite New Member</h3>
          
          {#if inviteLink}
            <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 class="text-sm font-medium text-blue-800 mb-2">Invitation Created</h4>
              <p class="text-sm text-blue-700 mb-2">Share this link with the user:</p>
              <div class="flex items-center">
                <input
                  type="text"
                  readonly
                  value={inviteLink}
                  class="flex-1 text-sm p-2 border rounded-l-md bg-white"
                />
                <button
                  type="button"
                  class="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  on:click={copyInviteLink}
                >
                  Copy
                </button>
              </div>
              <p class="text-xs text-blue-600 mt-2">
                The invite will expire in 7 days. In a production app, we would also send an email.
              </p>
            </div>
          {/if}
          
          <form method="POST" action="?/inviteUser" use:enhance={() => {
            isInviting = true;
            
            return async ({ result, update }) => {
              isInviting = false;
              await update();
            };
          }} class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  bind:value={inviteEmail}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
                <select
                  id="role"
                  name="role"
                  bind:value={inviteRole}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  {#each workspaceRoles as role}
                    <option value={role}>{role}</option>
                  {/each}
                </select>
              </div>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                on:click={toggleInviteForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                disabled={isInviting || !inviteEmail}
              >
                {#if isInviting}
                  <div class="flex items-center">
                    <LoadingSpinner size="sm" color="white" />
                    <span class="ml-2">Sending...</span>
                  </div>
                {:else}
                  {#if inviteLink}Create Another Invite{:else}Send Invite{/if}
                {/if}
              </button>
            </div>
          </form>
        </div>
      {/if}
      
      <!-- Members List -->
      <div class="bg-white border rounded-lg overflow-hidden mb-8">
        <div class="px-6 py-4 border-b">
          <h3 class="text-lg font-medium">Workspace Members</h3>
        </div>
        
        {#if members.length === 0}
          <div class="text-center py-12 text-gray-500">
            <p>No members found. Invite someone to get started.</p>
          </div>
        {:else}
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each members as member}
                <tr class="{isCurrentUser(member.user.id) ? 'bg-teal-50' : ''}">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <span class="text-xl font-medium text-teal-800">
                            {(member.user.displayName?.[0] || member.user.username?.[0] || '?').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {member.user.displayName || member.user.username}
                          {#if isCurrentUser(member.user.id)}
                            <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                              You
                            </span>
                          {/if}
                        </div>
                        <div class="text-sm text-gray-500">@{member.user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{member.user.email}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if isCurrentUser(member.user.id)}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {member.role}
                      </span>
                    {:else}
                      <form method="POST" action="?/updateRole" use:enhance>
                        <input type="hidden" name="userWorkspaceId" value={member.id} />
                        <select
                          name="role"
                          class="text-sm rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                          value={member.role}
                          on:change={handleRoleChange}
                        >
                          {#each workspaceRoles as role}
                            <option value={role}>{role}</option>
                          {/each}
                        </select>
                      </form>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.createdAt)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {#if isCurrentUser(member.user.id)}
                      <span class="text-gray-400">Cannot remove self</span>
                    {:else}
                      <form method="POST" action="?/removeUser" use:enhance>
                        <input type="hidden" name="userId" value={member.user.id} />
                        <button
                          type="submit"
                          class="text-red-600 hover:text-red-900"
                          on:click={(e) => { if (!confirm('Are you sure you want to remove this user from the workspace?')) e.preventDefault(); }}
                        >
                          Remove
                        </button>
                      </form>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
      
      <!-- Pending Invites -->
        <div class="bg-white border rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h3 class="text-lg font-medium">Pending Invitations</h3>
          </div>
          
          {#if pendingInvites.length === 0}
            <div class="text-center py-8 text-gray-500">
              <p>No pending invitations</p>
            </div>
          {:else}
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
                    Invited By
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each pendingInvites as invite}
                  <tr class="bg-yellow-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{invite.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {invite.role}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.invitedBy ? (invite.invitedBy.displayName || invite.invitedBy.username) : 'Unknown'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.invitedAt)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.expiresAt)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end space-x-2">
                        <button
                          class="text-blue-600 hover:text-blue-900"
                          on:click={() => {
                            navigator.clipboard.writeText(`${$page.url.origin}/signup?invite=${invite.token}`);
                            toastStore.success('Invite link copied');
                          }}
                        >
                          Copy Link
                        </button>
                        <form method="POST" action="?/cancelInvite" use:enhance>
                          <input type="hidden" name="inviteId" value={invite.id} />
                          <button
                            type="submit"
                            class="text-red-600 hover:text-red-900 ml-2"
                          >
                            Cancel
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>

  {/if}
</div>
