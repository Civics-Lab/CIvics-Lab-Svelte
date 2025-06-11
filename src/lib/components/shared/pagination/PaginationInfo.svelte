<!-- src/lib/components/shared/pagination/PaginationInfo.svelte -->
<script lang="ts">
  // Props
  export let startRecord: number;
  export let endRecord: number;
  export let totalRecords: number;
  export let isLoading: boolean = false;

  // Format large numbers with commas
  function formatNumber(num: number): string {
    return num.toLocaleString();
  }
</script>

<div class="text-sm text-gray-700">
  {#if isLoading}
    <div class="flex items-center gap-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
      Loading...
    </div>
  {:else if totalRecords === 0}
    <span>No records found</span>
  {:else}
    <span>
      Showing <span class="font-medium">{formatNumber(startRecord)}</span>
      to <span class="font-medium">{formatNumber(endRecord)}</span>
      of <span class="font-medium">{formatNumber(totalRecords)}</span>
      results
    </span>
  {/if}
</div>
