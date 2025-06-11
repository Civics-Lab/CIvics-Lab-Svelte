<!-- src/lib/components/shared/pagination/Pagination.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import PaginationControls from './PaginationControls.svelte';
  import PaginationInfo from './PaginationInfo.svelte';
  import PageSizeSelector from './PageSizeSelector.svelte';

  // Props
  export let currentPage: number = 1;
  export let totalPages: number = 1;
  export let totalRecords: number = 0;
  export let pageSize: number = 100;
  export let pageSizeOptions: number[] = [50, 100, 250, 500, 1000];
  export let isLoading: boolean = false;
  export let showPageSizeSelector: boolean = true;
  export let showInfo: boolean = true;
  export let showJumpToPage: boolean = true;

  const dispatch = createEventDispatcher<{
    pageChanged: { page: number };
    pageSizeChanged: { pageSize: number };
  }>();

  // Computed values
  $: startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  $: endRecord = Math.min(currentPage * pageSize, totalRecords);
  $: hasNextPage = currentPage < totalPages;
  $: hasPreviousPage = currentPage > 1;

  // Event handlers
  function handlePageChange(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isLoading) {
      dispatch('pageChanged', { page });
    }
  }

  function handlePageSizeChange(newPageSize: number) {
    if (newPageSize !== pageSize && !isLoading) {
      dispatch('pageSizeChanged', { pageSize: newPageSize });
    }
  }

  function handlePrevious() {
    if (hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }

  function handleNext() {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }

  function handleFirst() {
    if (currentPage !== 1) {
      handlePageChange(1);
    }
  }

  function handleLast() {
    if (currentPage !== totalPages) {
      handlePageChange(totalPages);
    }
  }

  function handleJumpBy(delta: number) {
    const newPage = Math.max(1, Math.min(totalPages, currentPage + delta));
    if (newPage !== currentPage) {
      handlePageChange(newPage);
    }
  }
</script>

<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-200">
  <!-- Left side: Records info and page size selector -->
  <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
    {#if showInfo}
      <PaginationInfo 
        {startRecord}
        {endRecord}
        {totalRecords}
        {isLoading}
      />
    {/if}
    
    {#if showPageSizeSelector}
      <PageSizeSelector
        {pageSize}
        {pageSizeOptions}
        {isLoading}
        on:pageSizeChanged={(e) => handlePageSizeChange(e.detail.pageSize)}
      />
    {/if}
  </div>

  <!-- Right side: Pagination controls -->
  {#if totalPages > 1}
    <PaginationControls
      {currentPage}
      {totalPages}
      {hasPreviousPage}
      {hasNextPage}
      {isLoading}
      {showJumpToPage}
      on:first={handleFirst}
      on:previous={handlePrevious}
      on:next={handleNext}
      on:last={handleLast}
      on:pageChanged={(e) => handlePageChange(e.detail.page)}
      on:jumpBy={(e) => handleJumpBy(e.detail.delta)}
    />
  {/if}
</div>
