<!-- src/routes/engage/+layout.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { workspaceStore } from '$lib/stores/workspaceStore';
    import { userStore } from '$lib/stores/userStore';
    import WorkspaceSelector from '$lib/components/WorkspaceSelector.svelte';
    import ToastContainer from '$lib/components/ToastContainer.svelte';
    import type { LayoutData } from './$types';
    import WorkspaceContext from '$lib/components/WorkspaceContext.svelte';
    
    export let data: LayoutData;
    
    // Function to determine if a menu item is active
    function isActive(path: string): boolean {
      if (path === '/engage' && $page.url.pathname === '/engage') {
        return true;
      }
      return $page.url.pathname.startsWith(path) && path !== '/engage';
    }
  </script>
  
  <WorkspaceContext supabase={data.supabase}>
    <div class="flex h-screen w-screen overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-teal-950 shadow-md flex flex-col h-full border-r border-slate-200">
        <!-- Sidebar Header - Workspace Selector -->
        <div class="p-4">
          <WorkspaceSelector />
        </div>
        
        <!-- Sidebar Menu -->
        <nav class="flex-grow p-4 space-y-1 overflow-y-auto text-teal-500">
          <div class="mb-6">
            <p class="text-xs font-semibold text-teal-800 uppercase tracking-wider mb-3 px-3">
              Main Menu
            </p>
            
            <!-- Dashboard -->
            <a 
              href="/engage" 
              class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/engage') && !isActive('/engage/') ? 'text-white font-medium hover:bg-teal-900' : 'text-teal-500 hover:bg-teal-900'}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </a>
            
            <!-- Contacts -->
            <a 
              href="/engage/contacts" 
              class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/engage/contacts') ? 'text-white font-medium hover:bg-teal-900' : 'text-teal-500 hover:bg-teal-900'}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Contacts
            </a>
            
            <!-- Businesses -->
            <a 
              href="/engage/businesses" 
              class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/engage/businesses') ? 'text-white font-medium hover:bg-teal-900' : 'text-teal-500 hover:bg-teal-900'}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Businesses
            </a>
            
            <!-- Donations -->
            <a 
              href="/engage/donations" 
              class="flex items-center px-3 py-2 text-sm rounded-md mb-1 {isActive('/engage/donations') ? 'text-white font-medium hover:bg-teal-900' : 'text-teal-500 hover:bg-teal-900'}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Donations
            </a>
          </div>
        </nav>
        
        <!-- Sidebar Footer -->
        <div class="p-4 border-t">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Account
          </p>
          <ul class="space-y-1">
            <li>
              <a 
                href="/engage/profile" 
                class="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Account
              </a>
            </li>
            <li>
              <a 
                href="/engage/settings" 
                class="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
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
                href="/engage/help" 
                class="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help & Support
              </a>
            </li>
            <li>
              <form method="POST" action="/logout">
                <button 
                  type="submit"
                  class="flex items-center w-full text-left px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </form>
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
  </WorkspaceContext>