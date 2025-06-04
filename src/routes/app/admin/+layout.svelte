<!-- src/routes/app/admin/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  // Admin navigation items
  const adminNav = [
    { label: 'Super Admins', href: '/app/admin/super-admins' }
  ];
  
  // Helper function to check if a route is active
  function isActive(href: string): boolean {
    return $page.url.pathname === href;
  }
  
  // Check if the user is a Super Admin
  onMount(async () => {
    try {
      const response = await fetch('/api/admin/super-admins', {
        headers: {
          'Authorization': `Bearer ${$page.data.session?.token || ''}`
        }
      });
      
      // If access is unauthorized, redirect to home
      if (response.status === 401 || response.status === 403) {
        console.log('User is not authorized to access admin section');
        goto('/app');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      goto('/app');
    }
  });
</script>

<div class="h-full w-full flex">
  <!-- Admin Sidebar -->
  <aside class="w-64 bg-slate-50 shadow-md flex flex-col h-full">
    <!-- Sidebar Header -->
    <div class="p-4 border-b border-slate-200 bg-slate-800 text-white">
      <h1 class="text-xl font-bold">Admin Panel</h1>
    </div>
    
    <!-- Admin Navigation -->
    <nav class="flex-grow p-4 space-y-6 overflow-y-auto">
      <ul class="space-y-1">
        {#each adminNav as item}
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
      
      <!-- Back to App Link -->
      <div class="mt-auto pt-4 border-t border-slate-200">
        <a 
          href="/app" 
          class="flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 hover:text-slate-800 rounded-md"
        >
          ← Back to App
        </a>
      </div>
    </nav>
  </aside>

  <!-- Admin Content -->
  <main class="flex-1 overflow-y-auto">
    <div class="p-6">
      <slot />
    </div>
  </main>
</div>
