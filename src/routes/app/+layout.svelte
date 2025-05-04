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
    // Import Lucide icons
    import { 
        LayoutDashboard, 
        Users, 
        Building2, 
        DollarSign, 
        Settings, 
        HelpCircle, 
        LogOut,
        ChevronDown
    } from '@lucide/svelte';
    
    export let data: LayoutData;
    
    // State for create workspace modal
    let isCreateModalOpen = false;
    
    // State for account popover
    let isAccountPopoverOpen = false;
    
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
    
    function toggleAccountPopover() {
      isAccountPopoverOpen = !isAccountPopoverOpen;
    }
    
    // Close popover when clicking outside
    function handleClickOutside(event) {
      const accountMenu = document.getElementById('account-menu');
      const accountButton = document.getElementById('account-button');
      
      if (accountMenu && accountButton) {
        if (!accountMenu.contains(event.target) && !accountButton.contains(event.target)) {
          isAccountPopoverOpen = false;
        }
      }
    }
    
    // Load workspaces when component mounts and select the first one if needed
    onMount(() => {
      workspaceStore.refreshWorkspaces();
      
      // Listen for create workspace event
      const handleCreateWorkspace = () => {
        openCreateWorkspaceModal();
      };
      
      window.addEventListener('createWorkspace', handleCreateWorkspace);
      document.addEventListener('click', handleClickOutside);
      
      return () => {
        window.removeEventListener('createWorkspace', handleCreateWorkspace);
        document.removeEventListener('click', handleClickOutside);
      };
    });
  </script>
  
  <div class="flex h-screen w-screen overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 shadow-md flex flex-col h-full border-r border-slate-200">
      <!-- Sidebar Header - Logo and Workspace Selector -->
      <div class="p-4 flex items-center justify-between">
        <!-- Logo -->
        <img 
          src="/logo.svg" 
          alt="Civics Lab Logo" 
          class="h-6 w-auto pl-3"
        />
        
        <!-- Workspace Picker Button -->
        <WorkspacePickerButton />
      </div>
      
      <!-- Sidebar Menu -->
      <nav class="flex-grow p-4 space-y-1 overflow-y-auto text-white">
        <div class="mb-6">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Main Menu
          </p>
          
          <!-- Dashboard -->
          <a 
            href="/app" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app') && !isActive('/app/') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <LayoutDashboard class="h-5 w-5 mr-2" />
            Dashboard
          </a>
          
          <!-- Contacts -->
          <a 
            href="/app/contacts" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app/contacts') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <Users class="h-5 w-5 mr-2" />
            Contacts
          </a>
          
          <!-- Businesses -->
          <a 
            href="/app/businesses" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app/businesses') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <Building2 class="h-5 w-5 mr-2" />
            Businesses
          </a>
          
          <!-- Donations -->
          <a 
            href="/app/donations" 
            class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/app/donations') ? 'bg-white text-slate-900 font-medium' : 'text-white hover:bg-slate-800'}"
          >
            <DollarSign class="h-5 w-5 mr-2" />
            Donations
          </a>
        </div>
      </nav>
      
      <!-- Sidebar Footer - Account Button (Replacing the previous Account section) -->
      <div class="p-4 border-t border-slate-800">
        <button 
          id="account-button"
          class="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md text-white hover:bg-slate-800 relative"
          on:click={toggleAccountPopover}
        >
          <div class="flex items-center">
            <!-- User avatar placeholder -->
            <div class="w-8 h-8 rounded-full bg-slate-700 mr-2 flex items-center justify-center">
              {#if $auth.user?.displayName}
                <span>{$auth.user.displayName.charAt(0).toUpperCase()}</span>
              {:else if $auth.user?.username}
                <span>{$auth.user.username.charAt(0).toUpperCase()}</span>
              {:else}
                <span>U</span>
              {/if}
            </div>
            <div class="text-left">
              <div class="font-medium">
                {#if $auth.user?.displayName}
                  {$auth.user.displayName}
                {:else}
                  User
                {/if}
              </div>
              <div class="text-xs text-slate-400">
                {#if $auth.user?.username}
                  @{$auth.user.username}
                {/if}
              </div>
            </div>
          </div>
          <ChevronDown class="h-4 w-4 text-slate-400" />
        </button>
        
        <!-- Account Popover Menu -->
        {#if isAccountPopoverOpen}
          <div 
            id="account-menu"
            class="absolute bottom-16 left-4 w-56 bg-slate-800 rounded-md shadow-lg overflow-hidden z-10"
          >
            <ul>
              <li>
                <a 
                  href="/app/settings" 
                  class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700"
                >
                  <Settings class="h-4 w-4 mr-2" />
                  Settings
                </a>
              </li>
              <li>
                <a 
                  href="/app/help" 
                  class="flex items-center px-4 py-2 text-sm text-white hover:bg-slate-700"
                >
                  <HelpCircle class="h-4 w-4 mr-2" />
                  Help & Support
                </a>
              </li>
              <li class="border-t border-slate-700">
                <button 
                  on:click={handleLogout}
                  class="flex items-center w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700"
                >
                  <LogOut class="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        {/if}
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
