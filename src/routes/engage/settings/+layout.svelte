<!-- src/routes/engage/settings/+layout.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { writable } from 'svelte/store';
    import type { LayoutData } from './$types';
    
    export let data: LayoutData;
  
    // Define the sidebar navigation structure
    const settingsNav = [
      {
        title: 'Workspace',
        items: [
          { label: 'General', href: '/engage/settings/workspace/general' },
          { label: 'People', href: '/engage/settings/workspace/people' },
          { label: 'Billing', href: '/engage/settings/workspace/billing' }
        ]
      },
      {
        title: 'Account',
        items: [
          { label: 'General', href: '/engage/settings/account/general' }
        ]
      }
    ];
  
    // Helper function to check if a route is active
    function isActive(href: string): boolean {
      return $page.url.pathname === href;
    }
  </script>
  
  <div class="h-full w-full p-6 overflow-y-auto">
    <div class="max-w-6xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">Settings</h1>
        <p class="text-gray-600">Manage your workspace and account settings</p>
      </div>
  
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Settings Sidebar -->
        <aside class="w-full md:w-64 flex-shrink-0">
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <nav class="p-2">
              {#each settingsNav as section}
                <div class="mb-4">
                  <h3 class="text-xs font-semibold uppercase px-3 py-2 text-gray-500">
                    {section.title}
                  </h3>
                  <ul class="space-y-1">
                    {#each section.items as item}
                      <li>
                        <a 
                          href={item.href} 
                          class="block px-3 py-2 rounded-md text-sm font-medium {isActive(item.href) ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}"
                        >
                          {item.label}
                        </a>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/each}
            </nav>
          </div>
        </aside>
  
        <!-- Settings Content -->
        <div class="flex-1 bg-white rounded-lg shadow">
          <slot />
        </div>
      </div>
    </div>
  </div>