<!-- src/routes/engage/settings/workspace/people/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import { userStore } from '$lib/stores/userStore';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    // State for workspace members
    const members = writable<any[]>([]);
    const isLoadingMembers = writable(true);
    const membersError = writable<string | null>(null);
    
    // State for invite form
    const showInviteForm = writable(false);
    const inviteEmail = writable('');
    const inviteRole = writable('Basic User');
    const isInviting = writable(false);
    
    // Available workspace roles
    const availableRoles = [
      'Super Admin',
      'Admin',
      'Basic User',
      'Volunteer'
    ];
    
    // Fetch workspace members
    async function fetchMembers() {
      if (!$workspaceStore.currentWorkspace) return;
      
      isLoadingMembers.set(true);
      membersError.set(null);
      
      try {
        // Get all user_workspaces for the current workspace
        const { data: workspaceUsers, error: workspaceUsersError } = await data.supabase
          .from('user_workspaces')
          .select('*')
          .eq('workspace_id', $workspaceStore.currentWorkspace.id);
        
        if (workspaceUsersError) throw workspaceUsersError;
        
        // Since we don't have access to user details directly, we'll create placeholder data
        // In a real app, this would be replaced with actual user data from a server endpoint
        const enhancedMembers = (workspaceUsers || []).map(member => {
          // Check if this is the current user
          const isCurrentUser = member.user_id === $userStore.user?.id;
          
          return {
            ...member,
            profiles: {
              id: member.user_id,
              email: isCurrentUser ? $userStore.user?.email : `user-${member.user_id.slice(0, 8)}@example.com`,
              first_name: isCurrentUser ? 'You' : '',
              last_name: isCurrentUser ? '(Current User)' : `User ${member.user_id.slice(0, 5)}`,
              avatar_url: null
            }
          };
        });
        
        members.set(enhancedMembers);
      } catch (err) {
        console.error('Error fetching workspace members:', err);
        membersError.set('Failed to load members');
      } finally {
        isLoadingMembers.set(false);
      }
    }
    
    // Update a member's role
    async function updateMemberRole(memberId: string, role: string) {
      try {
        const { error } = await data.supabase
          .from('user_workspaces')
          .update({ role })
          .eq('id', memberId);
        
        if (error) throw error;
        
        // Update the local state
        members.update(items => 
          items.map(item => 
            item.id === memberId ? { ...item, role } : item
          )
        );
        
        toastStore.success('Member role updated');
      } catch (err) {
        console.error('Error updating member role:', err);
        toastStore.error('Failed to update member role');
      }
    }
    
    // Remove a member from the workspace
    async function removeMember(memberId: string, userId: string) {
      // Don't allow removing yourself
      if (userId === $userStore.user?.id) {
        toastStore.error('You cannot remove yourself from the workspace');
        return;
      }
      
      if (!confirm('Are you sure you want to remove this member from the workspace?')) {
        return;
      }
      
      try {
        const { error } = await data.supabase
          .from('user_workspaces')
          .delete()
          .eq('id', memberId);
        
        if (error) throw error;
        
        // Update the local state
        members.update(items => items.filter(item => item.id !== memberId));
        
        toastStore.success('Member removed from workspace');
      } catch (err) {
        console.error('Error removing member:', err);
        toastStore.error('Failed to remove member');
      }
    }
    
    // Toggle invite form
    function toggleInviteForm() {
      showInviteForm.update(value => !value);
      if (!$showInviteForm) {
        // Reset form when closing
        inviteEmail.set('');
        inviteRole.set('Basic User');
      }
    }
    
    // Invite a user to the workspace
    async function inviteUser() {
      if (!$inviteEmail.trim() || !$inviteRole || !$workspaceStore.currentWorkspace) {
        return;
      }
      
      isInviting.set(true);
      
      try {
        // Call our server-side API that uses the service role key
        const response = await fetch('/api/invite-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: $inviteEmail.trim(),
            workspaceId: $workspaceStore.currentWorkspace.id,
            role: $inviteRole
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send invitation');
        }
        
        const result = await response.json();
        
        // Add the user to our members list with pending status
        const newMember = {
          id: crypto.randomUUID(), // A temporary ID for UI purposes
          user_id: result.user?.id || crypto.randomUUID(),
          workspace_id: $workspaceStore.currentWorkspace.id,
          role: $inviteRole,
          created_at: new Date().toISOString(),
          profiles: {
            id: result.user?.id || crypto.randomUUID(),
            email: $inviteEmail,
            first_name: 'Pending',
            last_name: 'Invitation',
            avatar_url: null
          },
          pending: true
        };
        
        // Add to local state
        members.update(items => [...items, newMember]);
        
        toastStore.success(`Invitation sent to ${$inviteEmail}`);
        toggleInviteForm();
      } catch (err) {
        console.error('Error inviting user:', err);
        toastStore.error(err.message || 'Failed to send invitation');
      } finally {
        isInviting.set(false);
      }
    }
    
    // Fetch members when workspace changes
    $: if ($workspaceStore.currentWorkspace) {
      fetchMembers();
    }
    
    // Format member name for display
    function formatMemberName(member) {
      if (member.profiles) {
        const profile = member.profiles;
        if (profile.first_name || profile.last_name) {
          return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        }
        return profile.email;
      }
      return 'Unknown User';
    }
    
    // Check if the member is the current user
    function isCurrentUser(userId: string) {
      return userId === $userStore.user?.id;
    }

</script>
  
<svelte:head>
  <title>Workspace Members | Engage</title>
</svelte:head>
  
<div class="p-6">
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
    
    <!-- Invite User Form -->
    {#if $showInviteForm}
      <div class="bg-gray-50 p-6 rounded-lg border mb-6">
        <h3 class="text-lg font-medium mb-4">Invite New Member</h3>
        <form on:submit|preventDefault={inviteUser} class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                id="email"
                type="email"
                bind:value={$inviteEmail}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="colleague@example.com"
              />
            </div>
            <div>
              <label for="role" class="block text-sm font-medium text-gray-700">Role</label>
              <select
                id="role"
                bind:value={$inviteRole}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                {#each availableRoles as role}
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
              disabled={$isInviting || !$inviteEmail}
            >
              {#if $isInviting}
                <div class="flex items-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span class="ml-2">Inviting...</span>
                </div>
              {:else}
                Send Invite
              {/if}
            </button>
          </div>
        </form>
      </div>
    {/if}
    
    <!-- Members List -->
    <div class="bg-white border rounded-lg overflow-hidden">
      {#if $isLoadingMembers}
        <div class="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      {:else if $membersError}
        <div class="text-center py-12 text-red-500">
          {$membersError}
        </div>
      {:else if $members.length === 0}
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
            {#each $members as member}
              <tr class="{isCurrentUser(member.user_id) ? 'bg-teal-50' : ''}">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      {#if member.profiles?.avatar_url}
                        <img class="h-10 w-10 rounded-full" src={member.profiles.avatar_url} alt="" />
                      {:else}
                        <div class="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <span class="text-xl font-medium text-teal-800">
                            {(member.profiles?.first_name?.[0] || member.profiles?.email?.[0] || '?').toUpperCase()}
                          </span>
                        </div>
                      {/if}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {formatMemberName(member)}
                        {#if isCurrentUser(member.user_id)}
                          <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            You
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{member.profiles?.email || 'No email'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {#if isCurrentUser(member.user_id)}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {member.role}
                    </span>
                  {:else if member.pending}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {member.role} (Pending)
                    </span>
                  {:else}
                    <select
                      class="text-sm rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      value={member.role}
                      on:change={(e) => updateMemberRole(member.id, e.target.value)}
                    >
                      {#each availableRoles as role}
                        <option value={role}>{role}</option>
                      {/each}
                    </select>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {#if isCurrentUser(member.user_id)}
                    <span class="text-gray-400">Cannot remove self</span>
                  {:else if member.pending}
                    <button
                      class="text-red-600 hover:text-red-900"
                      on:click={() => removeMember(member.id, member.user_id)}
                    >
                      Cancel Invitation
                    </button>
                  {:else}
                    <button
                      class="text-red-600 hover:text-red-900"
                      on:click={() => removeMember(member.id, member.user_id)}
                    >
                      Remove
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>