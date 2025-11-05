<script lang="ts">
  import ToastContainer from '$lib/components/ToastContainer.svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
  $: data;
</script>

<!-- Clean public layout without admin sidebar -->
<div class="min-h-screen bg-gray-50">
  <slot />
</div>

<!-- Toast container for notifications -->
<ToastContainer />
