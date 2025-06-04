<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  // Redirect to super admins page by default
  onMount(() => {
    goto('/app/admin/super-admins');
  });
</script>

<div class="flex flex-col items-center justify-center h-full">
  <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  <div class="mt-4 text-gray-600">Loading Admin Panel...</div>
</div>
