<!-- src/lib/components/DetailsSheetOverlay.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';

  // Props
  export let isOpen = false;
  export let zIndex = 9998; // Use z-modal-backdrop class by default
  
  const dispatch = createEventDispatcher();
  
  // Handle closing when clicked
  function handleClick() {
    dispatch('close');
  }
  
  // Handle key events (ESC key)
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      dispatch('close');
    }
  }
  
  // Prevent scrolling on the body when overlay is open
  function disableBodyScroll() {
    document.body.style.overflow = 'hidden';
  }
  
  function enableBodyScroll() {
    document.body.style.overflow = '';
  }
  
  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    if (isOpen) disableBodyScroll();
    
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      enableBodyScroll();
    };
  });
  
  // Watch for changes to isOpen
  $: if (isOpen) {
    disableBodyScroll();
  } else {
    enableBodyScroll();
  }
  
  onDestroy(() => {
    enableBodyScroll();
  });
</script>

{#if isOpen}
  <div 
    class="fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity"
    style="z-index: {zIndex};"
    on:click|self={handleClick}
    transition:fade={{ duration: 200 }}
  >
    <slot />
  </div>
{/if}
