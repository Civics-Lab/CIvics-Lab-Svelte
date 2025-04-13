<script lang="ts">
  export let logo: string | null = null;
  export let name: string = '';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  
  // Compute sizes based on the size prop
  $: dimensions = size === 'sm' ? 'w-8 h-8 text-xs' : 
                   size === 'lg' ? 'w-12 h-12 text-lg' : 
                   'w-10 h-10 text-sm';
</script>

{#if logo}
  <img src={logo} alt="{name} logo" class="{dimensions} rounded-md object-contain" />
{:else}
  <!-- Fallback to initials if no logo -->
  <div class="{dimensions} flex items-center justify-center bg-teal-100 text-teal-800 font-medium rounded-md">
    {name ? name.charAt(0).toUpperCase() : '?'}
  </div>
{/if}
