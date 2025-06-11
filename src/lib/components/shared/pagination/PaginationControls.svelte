<!-- src/lib/components/shared/pagination/PaginationControls.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  // Props
  export let currentPage: number;
  export let totalPages: number;
  export let hasPreviousPage: boolean;
  export let hasNextPage: boolean;
  export let isLoading: boolean = false;
  export let showJumpToPage: boolean = true;

  const dispatch = createEventDispatcher<{
    first: void;
    previous: void;
    next: void;
    last: void;
    pageChanged: { page: number };
    jumpBy: { delta: number };
  }>();

  // Calculate visible page numbers for pagination
  $: visiblePages = getVisiblePages(currentPage, totalPages);

  function getVisiblePages(current: number, total: number): number[] {
    const maxVisible = 7; // Show up to 7 page numbers
    const pages: number[] = [];

    if (total <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination for large datasets
      const start = Math.max(1, current - 3);
      const end = Math.min(total, current + 3);

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push(-1); // Ellipsis marker
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < total) {
        if (end < total - 1) pages.push(-1); // Ellipsis marker
        pages.push(total);
      }
    }

    return pages;
  }

  function handleJumpByDelta(delta: number) {
    dispatch('jumpBy', { delta });
  }
</script>

<div class="flex items-center gap-2">
  <!-- Quick jump controls for large datasets -->
  {#if totalPages > 20}
    <div class="hidden sm:flex items-center gap-1 mr-2">
      <button
        type="button"
        on:click={() => handleJumpByDelta(-10)}
        disabled={isLoading || currentPage <= 10}
        class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Jump back 10 pages"
      >
        -10
      </button>
      <button
        type="button"
        on:click={() => handleJumpByDelta(-5)}
        disabled={isLoading || currentPage <= 5}
        class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Jump back 5 pages"
      >
        -5
      </button>
    </div>
  {/if}

  <!-- First and Previous buttons -->
  <div class="flex items-center">
    <button
      type="button"
      on:click={() => dispatch('first')}
      disabled={isLoading || !hasPreviousPage}
      class="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title="First page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    </button>
    
    <button
      type="button"
      on:click={() => dispatch('previous')}
      disabled={isLoading || !hasPreviousPage}
      class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Previous page"
    >
      Previous
    </button>
  </div>

  <!-- Page numbers -->
  <div class="flex items-center gap-1">
    {#each visiblePages as page}
      {#if page === -1}
        <span class="px-3 py-2 text-sm text-gray-400">...</span>
      {:else}
        <button
          type="button"
          on:click={() => dispatch('pageChanged', { page })}
          disabled={isLoading}
          class={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100 disabled:opacity-50'
          } disabled:cursor-not-allowed`}
        >
          {page.toLocaleString()}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Next and Last buttons -->
  <div class="flex items-center">
    <button
      type="button"
      on:click={() => dispatch('next')}
      disabled={isLoading || !hasNextPage}
      class="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Next page"
    >
      Next
    </button>
    
    <button
      type="button"
      on:click={() => dispatch('last')}
      disabled={isLoading || !hasNextPage}
      class="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Last page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  <!-- Quick jump controls for large datasets -->
  {#if totalPages > 20}
    <div class="hidden sm:flex items-center gap-1 ml-2">
      <button
        type="button"
        on:click={() => handleJumpByDelta(5)}
        disabled={isLoading || currentPage > totalPages - 5}
        class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Jump forward 5 pages"
      >
        +5
      </button>
      <button
        type="button"
        on:click={() => handleJumpByDelta(10)}
        disabled={isLoading || currentPage > totalPages - 10}
        class="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Jump forward 10 pages"
      >
        +10
      </button>
    </div>
  {/if}
</div>
