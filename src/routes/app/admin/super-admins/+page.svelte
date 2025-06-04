<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Trash, Plus, ShieldAlert, UserPlus } from 'lucide-svelte';

  // Get data from the server
  export let data;

  let showAddModal = false;
  let showRemoveModal = false;
  let showInviteModal = false;
  let selectedUser: any = null;
  let inviteEmail = '';
  let message: { text: string; type: 'success' | 'error' } | null = null;
  
  // Handle form action results
  $: {
    if ($page.form?.success) {
      message = {
        text: $page.form.message,
        type: 'success'
      };
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        message = null;
      }, 3000);
      
      // Close any open modals
      showAddModal = false;
      showRemoveModal = false;
      showInviteModal = false;
      inviteEmail = '';
    } else if ($page.form?.message) {
      message = {
        text: $page.form.message,
        type: 'error'
      };
    }
  }
  
  function confirmRemove(user: any) {
    selectedUser = user;
    showRemoveModal = true;
  }
  
  function cancelRemove() {
    selectedUser = null;
    showRemoveModal = false;
  }
  
  function confirmAdd(user: any) {
    selectedUser = user;
    showAddModal = true;
  }
  
  function cancelAdd() {
    selectedUser = null;
    showAddModal = false;
  }
  
  function showInvite() {
    showInviteModal = true;
  }
  
  function cancelInvite() {
    showInviteModal = false;
    inviteEmail = '';
  }
</script>

<svelte:head>
  <title>Super Admin Management</title>
</svelte:head>

<div class="container mx-auto max-w-6xl">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold flex items-center gap-2">
      <ShieldAlert class="text-red-500" />
      Super Admin Management
    </h1>
    
    <button 
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
      on:click={showInvite}
    >
      <UserPlus size={16} />
      Invite Super Admin
    </button>
  </div>
  
  {#if data.needsMigration}
    <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
      <p class="font-bold">Database Migration Required</p>
      <p>{data.error}</p>
      <p class="mt-2">Run the following command to add the Super Admin functionality:</p>
      <pre class="bg-gray-100 p-2 mt-2 rounded">npm run add:super-admin</pre>
    </div>
  {:else}
    {#if message}
      <div class="{message.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'} border-l-4 p-4 mb-6">
        <p>{message.text}</p>
      </div>
    {/if}
    
    <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold">Current Global Super Admins</h2>
        <p class="text-gray-600 text-sm">Users with access to all workspaces</p>
      </div>
      
      <div class="divide-y">
        {#if data.superAdmins && data.superAdmins.length > 0}
          {#each data.superAdmins as admin}
            <div class="px-6 py-4 flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  {#if admin.avatar}
                    <img src={admin.avatar} alt={admin.displayName || admin.username} class="w-10 h-10 rounded-full" />
                  {:else}
                    <span class="text-blue-500 font-semibold">{(admin.displayName || admin.username).charAt(0).toUpperCase()}</span>
                  {/if}
                </div>
                <div>
                  <p class="font-medium">{admin.displayName || admin.username}</p>
                  <p class="text-sm text-gray-600">{admin.email}</p>
                </div>
              </div>
              
              <button 
                class="p-2 text-red-600 hover:bg-red-50 rounded-full"
                on:click={() => confirmRemove(admin)}
                disabled={admin.id === $page.data.user?.id}
                title={admin.id === $page.data.user?.id ? "You cannot remove your own Super Admin status" : "Remove Super Admin status"}
              >
                <Trash size={18} />
              </button>
            </div>
          {/each}
        {:else}
          <div class="px-6 py-4 text-gray-500 italic">
            No Super Admins found. Add a Super Admin below.
          </div>
        {/if}
      </div>
    </div>
    
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold">Other Users</h2>
        <p class="text-gray-600 text-sm">Add Super Admin privileges to existing users</p>
      </div>
      
      <div class="divide-y">
        {#if data.otherUsers && data.otherUsers.length > 0}
          {#each data.otherUsers as user}
            <div class="px-6 py-4 flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {#if user.avatar}
                    <img src={user.avatar} alt={user.displayName || user.username} class="w-10 h-10 rounded-full" />
                  {:else}
                    <span class="text-gray-500 font-semibold">{(user.displayName || user.username).charAt(0).toUpperCase()}</span>
                  {/if}
                </div>
                <div>
                  <p class="font-medium">{user.displayName || user.username}</p>
                  <p class="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <button 
                class="p-2 text-green-600 hover:bg-green-50 rounded-full"
                on:click={() => confirmAdd(user)}
                title="Add Super Admin status"
              >
                <Plus size={18} />
              </button>
            </div>
          {/each}
        {:else}
          <div class="px-6 py-4 text-gray-500 italic">
            No other users found.
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Remove Super Admin Modal -->
    {#if showRemoveModal && selectedUser}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Remove Super Admin</h3>
          <p class="mb-4">Are you sure you want to remove Super Admin privileges from <span class="font-semibold">{selectedUser.displayName || selectedUser.username}</span>?</p>
          <p class="text-sm text-gray-600 mb-6">This user will no longer have access to all workspaces.</p>
          
          <div class="flex justify-end gap-2">
            <button 
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              on:click={cancelRemove}
            >
              Cancel
            </button>
            
            <form method="POST" action="?/removeSuperAdmin" use:enhance>
              <input type="hidden" name="userId" value={selectedUser.id} />
              <button 
                type="submit"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Remove
              </button>
            </form>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Add Super Admin Modal -->
    {#if showAddModal && selectedUser}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Add Super Admin</h3>
          <p class="mb-4">Are you sure you want to grant Super Admin privileges to <span class="font-semibold">{selectedUser.displayName || selectedUser.username}</span>?</p>
          <p class="text-sm text-gray-600 mb-6">This user will have access to all workspaces in the system.</p>
          
          <div class="flex justify-end gap-2">
            <button 
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              on:click={cancelAdd}
            >
              Cancel
            </button>
            
            <form method="POST" action="?/addSuperAdmin" use:enhance>
              <input type="hidden" name="userId" value={selectedUser.id} />
              <button 
                type="submit"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Invite Super Admin Modal -->
    {#if showInviteModal}
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Invite Super Admin</h3>
          <p class="mb-4">Enter email address to invite as a Super Admin.</p>
          
          <form method="POST" action="?/inviteSuperAdmin" use:enhance class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                bind:value={inviteEmail}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                placeholder="email@example.com"
                required
              />
            </div>
            
            <div class="flex justify-end gap-2 pt-2">
              <button 
                type="button"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                on:click={cancelInvite}
              >
                Cancel
              </button>
              
              <button 
                type="submit"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  {/if}
</div>
