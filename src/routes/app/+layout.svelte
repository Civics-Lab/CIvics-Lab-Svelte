<!-- src/routes/app/+layout.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { auth } from '$lib/auth/client';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import ToastContainer from '$lib/components/ToastContainer.svelte';
    import WorkspacePickerButton from '$lib/components/WorkspacePickerButton.svelte';
    import CreateWorkspaceModal from '$lib/components/CreateWorkspaceModal.svelte';
    import type { LayoutData } from './$types';
    
    export let data: LayoutData;
    // We use data for other purposes but no longer need to pass supabase to the workspace components
    
    // State for create workspace modal
    let isCreateModalOpen = false;
    
    // Function to determine if a menu item is active
    function isActive(path: string): boolean {
      if (path === '/app' && $page.url.pathname === '/app') {
        return true;
      }
      return $page.url.pathname.startsWith(path) && path !== '/app';
    }

    function handleLogout() {
      auth.logout();
      goto('/login');
    }
    
    function openCreateWorkspaceModal() {
      isCreateModalOpen = true;
    }
    
    function closeCreateWorkspaceModal() {
      isCreateModalOpen = false;
    }
    
    // Load workspaces when component mounts and select the first one if needed
    onMount(() => {
      workspaceStore.refreshWorkspaces();
      
      // Listen for create workspace event
      const handleCreateWorkspace = () => {
        openCreateWorkspaceModal();
      };
      
      window.addEventListener('createWorkspace', handleCreateWorkspace);
      
      return () => {
        window.removeEventListener('createWorkspace', handleCreateWorkspace);
      };
    });
  </script>
  
  <div class="flex h-screen w-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 shadow-md flex flex-col h-full border-r border-slate-200">
      <!-- Sidebar Header - Workspace Selector -->
      <div class="p-4 flex items-center space-x-3">
        <WorkspacePickerButton />
        <div>
          <div class="text-white font-bold text-xl">Civics Lab</div>
          <div class="text-slate-400 text-sm truncate max-w-[180px]">
            {#if $workspaceStore.currentWorkspace}
              {$workspaceStore.currentWorkspace.name}
            {:else}
              App Portal
            {/if}
          </div>
        </div>
      </div>
      
      <!-- Sidebar Menu -->
      <nav class="flex-grow p-4 space-y-1 overflow-y-auto text-white">
        <div class="mb-6">
          <p class="text-xs font-semibold text-white uppercase tracking-wider mb-3 px-3">
            Main Menu
          </p>
          
          <!-- Dashboard -->
          <a 
            href="/app" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app') && !isActive('/app/') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </a>
          
          <!-- Contacts -->
          <a 
            href="/app/contacts" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app/contacts') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Contacts
          </a>
          
          <!-- Businesses -->
          <a 
            href="/app/businesses" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app/businesses') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Businesses
          </a>
          
          <!-- Donations -->
          <a 
            href="/app/donations" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app/donations') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Donations
          </a>
        </div>
      </nav>
      
      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-slate-800">
        <p class="text-xs font-semibold text-white uppercase tracking-wider mb-3 px-3">
          Account
        </p>
        <ul class="space-y-1">
          <li>
            <a 
              href="/app/settings" 
              class="flex items-center px-3 py-2 text-sm rounded-md mb-1 text-white hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </li>
          <li>
            <a 
              href="/app/help" 
              class="flex items-center px-3 py-2 text-sm rounded-md mb-1 text-white hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help & Support
            </a>
          </li>
          <li>
            <button 
              on:click={handleLogout}
              class="flex items-center w-full text-left px-3 py-2 text-sm rounded-md mb-1 text-white hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto w-full">
      <div class="h-full w-full">
        <slot />
      </div>
    </main>
  </div>
  
  <!-- Toast container for notifications -->
  <ToastContainer />
  
  <!-- Create Workspace Modal -->
  <CreateWorkspaceModal 
    isOpen={isCreateModalOpen} 
    onClose={closeCreateWorkspaceModal}
  />