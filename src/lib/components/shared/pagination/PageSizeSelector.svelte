<!-- src/lib/components/shared/pagination/PageSizeSelector.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let pageSize: number;
  export let pageSizeOptions: number[] = [50, 100, 250, 500, 1000];
  export let isLoading: boolean = false;

  const dispatch = createEventDispatcher<{
    pageSizeChanged: { pageSize: number };
  }>();

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value);
    dispatch('pageSizeChanged', { pageSize: newPageSize });
  }
</script>

<div class="flex items-center gap-2">
  <label for="page-size" class="text-sm text-gray-700">Show:</label>
  <select
    id="page-size"
    bind:value={pageSize}
    on:change={handleChange}
    disabled={isLoading}
    class="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
  >
    {#each pageSizeOptions as option}
      <option value={option}>{option.toLocaleString()}</option>
    {/each}
  </select>
  <span class="text-sm text-gray-700">per page</span>
</div>
