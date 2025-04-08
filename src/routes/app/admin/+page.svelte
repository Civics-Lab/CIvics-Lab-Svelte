<!-- src/routes/app/admin/+page.svelte -->
<script lang="ts">
  export let data;
  
  const adminModules = [
    {
      title: 'User Invites',
      description: 'Invite new users to your workspaces',
      icon: 'envelope-open',
      link: '/app/admin/invites',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Workspaces',
      description: 'Manage your workspaces and settings',
      icon: 'briefcase',
      link: '/app/admin/workspaces',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'User Management',
      description: 'Manage users and their permissions',
      icon: 'users',
      link: '/app/admin/users',
      color: 'bg-purple-100 text-purple-600'
    }
  ];
</script>

<svelte:head>
  <title>Admin Dashboard | Civics Lab</title>
</svelte:head>

<div class="container mx-auto p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Admin Dashboard</h1>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each adminModules as module}
      <a href={module.link} class="block group">
        <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
          <div class="flex items-center mb-4">
            <div class="{module.color} p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {#if module.icon === 'envelope-open'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                {:else if module.icon === 'briefcase'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                {:else if module.icon === 'users'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                {/if}
              </svg>
            </div>
            <h2 class="ml-4 text-xl font-semibold group-hover:text-blue-600 transition-colors">{module.title}</h2>
          </div>
          <p class="text-gray-600">{module.description}</p>
        </div>
      </a>
    {/each}
  </div>
</div>
