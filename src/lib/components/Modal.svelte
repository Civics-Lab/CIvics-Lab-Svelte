<!-- src/lib/components/Modal.svelte -->
<script lang="ts">
    import { onMount, createEventDispatcher, onDestroy } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    
    export let isOpen = false;
    export let title = '';
    export let maxWidth = 'max-w-2xl';
    export let closeOnEscape = true;
    export let closeOnClickOutside = true;
    
    const dispatch = createEventDispatcher();
    
    function close() {
      dispatch('close');
    }
    
    function handleKeydown(event: KeyboardEvent) {
      if (isOpen && closeOnEscape && event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }
    
    function handleClickOutside(event: MouseEvent) {
      if (closeOnClickOutside && modalContainer && event.target === modalContainer) {
        close();
      }
    }
    
    let modalContainer: HTMLDivElement;
    
    onMount(() => {
      document.addEventListener('keydown', handleKeydown);
    });
    
    onDestroy(() => {
      document.removeEventListener('keydown', handleKeydown);
    });
  </script>
  
  {#if isOpen}
    <div 
      bind:this={modalContainer} 
      class="fixed inset-0 z-50 overflow-y-auto" 
      on:click={handleClickOutside}
      transition:fade={{ duration: 200 }}
    >
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <!-- Centering trick -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <!-- Modal panel -->
        <div 
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:w-full {maxWidth}"
          transition:fly={{ y: 30, duration: 300 }}
        >
          <!-- Modal header -->
          <div class="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900">{title}</h3>
            <button 
              type="button" 
              class="text-gray-400 hover:text-gray-500" 
              on:click={close}
            >
              <span class="sr-only">Close</span>
              <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Modal content -->
          <div class="px-6 py-5 bg-white">
            <slot />
          </div>
          
          <!-- Modal footer -->
          {#if $$slots.footer}
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <slot name="footer" />
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}