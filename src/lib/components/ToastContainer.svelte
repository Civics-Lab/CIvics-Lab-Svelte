<!-- src/lib/components/ToastContainer.svelte -->
<script lang="ts">
    import { toastStore } from '$lib/stores/toastStore';
    import Toast from './Toast.svelte';
  </script>
  
  <div class="fixed bottom-0 right-0 p-4 z-50 space-y-4 pointer-events-none">
    {#each $toastStore as toast (toast.id)}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        duration={toast.duration} 
        onClose={() => toastStore.remove(toast.id)} 
      />
    {/each}
  </div>