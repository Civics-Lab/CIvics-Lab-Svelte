<!-- src/routes/app/settings/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    onMount(() => {
      // Redirect to workspace general settings by default
      goto('/app/settings/workspace/general');
    });
  </script>
  
  <div class="p-6 text-center">
    <div class="animate-pulse">
      <p class="text-gray-500">Redirecting to settings...</p>
    </div>
  </div>