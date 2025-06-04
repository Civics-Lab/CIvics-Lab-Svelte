<!-- src/routes/app/settings/+layout.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import type { LayoutData } from './$types';
    
    export let data: LayoutData;
    
    // Check if the user is a global Super Admin
    let isGlobalSuperAdmin = false;
    
    onMount(async () => {
      // Check if the user is a global Super Admin
      try {
        const response = await fetch('/api/admin/access', {
          headers: {
            'Authorization': `Bearer ${data.session?.token || ''}`
          }
        });
        
        // If access is successful, the user is a global Super Admin
        isGlobalSuperAdmin = response.status === 200;
      } catch (error) {
        console.error('Error checking Super Admin status:', error);
        isGlobalSuperAdmin = false;
      }
    });
  
    // Define the sidebar navigation structure
    $: settingsNav = [
      {
        title: 'Workspace',
        items: [
          { label: 'General', href: '/app/settings/workspace/general' },
          { label: 'People', href: '/app/settings/workspace/people' },
          { label: 'Billing', href: '/app/settings/workspace/billing' }
        ]
      },
      {
        title: 'Account',
        items: [
          { label: 'General', href: '/app/settings/account/general' }
        ]
      },
      // Only show the Admin section if the user is a global Super Admin
      ...isGlobalSuperAdmin ? [{
        title: 'Admin',
        items: [
          { label: 'Super Admins', href: '/app/settings/admin/super-admins' }
        ]
      }] : []
    ];
  
    // Helper function to check if a route is active
    function isActive(href: string): boolean {
      return $page.url.pathname === href;
    }
  </script>
  
  <div class="h-full w-full flex">
    <!-- Settings Sidebar -->
    <aside class="w-64 bg-slate-50 shadow-md flex flex-col h-full">
      <!-- Sidebar Header -->
      <div class="p-4 border-b border-slate-200">
        <h1 class="text-xl font-bold text-slate-800">Settings</h1>
      </div>
      
      <!-- Settings Navigation -->
      <nav class="flex-grow p-4 space-y-6 overflow-y-auto">
        {#each settingsNav as section}
          <div class="mb-4">
            <h3 class="text-xs font-semibold uppercase px-3 py-2 text-slate-600">
              {section.title}
            </h3>
            <ul class="space-y-1">
              {#each section.items as item}
                <li>
                  <a 
                    href={item.href} 
                    class="flex items-center px-3 py-2 text-sm rounded-md {isActive(item.href) ? 'bg-slate-200 text-slate-800 font-medium' : 'text-slate-700 hover:bg-slate-200 hover:text-slate-800'}"
                  >
                    {item.label}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </nav>
    </aside>

    <!-- Settings Content -->
    <main class="flex-1 overflow-y-auto">
      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
