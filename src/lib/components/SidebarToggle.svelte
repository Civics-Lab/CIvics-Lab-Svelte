<!-- src/lib/components/SidebarToggle.svelte -->
<script lang="ts">
  import { toggleSidebar, sidebarVisible } from '$lib/stores/sidebarStore';
  import { PanelLeftOpen, PanelLeftClose } from '@lucide/svelte';
  
  function handleToggle() {
    toggleSidebar();
  }
</script>

<button
  class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-colors"
  on:click={handleToggle}
  aria-label={$sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
  title={$sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
>
  {#if $sidebarVisible}
    <PanelLeftClose size={20} />
  {:else}
    <PanelLeftOpen size={20} />
  {/if}
</button>