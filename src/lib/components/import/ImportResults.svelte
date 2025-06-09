<!-- src/lib/components/import/ImportResults.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ImportResults } from '$lib/types/import';

  export let results: ImportResults;
  export let validateOnly: boolean = false;

  const dispatch = createEventDispatcher();

  $: successRate = results.totalRecords > 0 
    ? Math.round((results.successfulRecords / results.totalRecords) * 100) 
    : 0;
  
  $: hasErrors = results.errors && results.errors.length > 0;
  $: isSuccess = results.status === 'completed' && results.failedRecords === 0;
  $: isPartialSuccess = results.status === 'completed' && results.failedRecords > 0;
  $: isFailed = results.status === 'failed';

  function downloadErrorReport() {
    if (!results.errors || results.errors.length === 0) return;

    // Create CSV content for errors
    const headers = ['Row Number', 'Field', 'Error Type', 'Error Message', 'Raw Data'];
    const csvContent = [
      headers.join(','),
      ...results.errors.map(error => [
        error.rowNumber,
        error.fieldName || '',
        error.errorType,
        `"${error.errorMessage.replace(/"/g, '""')}"`,
        `"${JSON.stringify(error.rawData || {}).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import_errors_${results.sessionId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleClose() {
    dispatch('close');
  }

  function handleRestart() {
    dispatch('restart');
  }

  function groupErrorsByType(errors: any[]) {
    const groups: Record<string, any[]> = {};
    errors.forEach(error => {
      if (!groups[error.errorType]) {
        groups[error.errorType] = [];
      }
      groups[error.errorType].push(error);
    });
    return groups;
  }

  $: errorGroups = hasErrors ? groupErrorsByType(results.errors) : {};
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      {validateOnly ? 'Validation Results' : 'Import Results'}
    </h3>
    <p class="text-sm text-gray-600">
      {validateOnly 
        ? 'Review the validation results for your data' 
        : 'Your import process has completed'}
    </p>
  </div>

  <!-- Overall Status -->
  <div class="rounded-lg p-6 {isSuccess 
    ? 'bg-green-50 border border-green-200' 
    : isPartialSuccess 
      ? 'bg-yellow-50 border border-yellow-200' 
      : 'bg-red-50 border border-red-200'}">
    
    <div class="flex items-center justify-center mb-4">
      {#if isSuccess}
        <svg class="h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      {:else if isPartialSuccess}
        <svg class="h-12 w-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      {:else}
        <svg class="h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      {/if}
    </div>

    <div class="text-center">
      <h4 class="text-xl font-semibold {isSuccess 
        ? 'text-green-900' 
        : isPartialSuccess 
          ? 'text-yellow-900' 
          : 'text-red-900'}">
        {#if validateOnly}
          {isSuccess 
            ? 'Validation Passed' 
            : isPartialSuccess 
              ? 'Validation Issues Found' 
              : 'Validation Failed'}
        {:else}
          {isSuccess 
            ? 'Import Successful' 
            : isPartialSuccess 
              ? 'Import Partially Successful' 
              : 'Import Failed'}
        {/if}
      </h4>
      
      <p class="mt-2 {isSuccess 
        ? 'text-green-700' 
        : isPartialSuccess 
          ? 'text-yellow-700' 
          : 'text-red-700'}">
        {#if validateOnly}
          {isSuccess 
            ? 'All data passed validation checks and is ready for import' 
            : isPartialSuccess 
              ? `${results.successfulRecords} of ${results.totalRecords} rows passed validation` 
              : 'Critical validation errors prevent import'}
        {:else}
          {isSuccess 
            ? `Successfully imported ${results.successfulRecords} records` 
            : isPartialSuccess 
              ? `Imported ${results.successfulRecords} of ${results.totalRecords} records` 
              : 'Import could not be completed due to errors'}
        {/if}
      </p>
    </div>
  </div>

  <!-- Summary Statistics -->
  <div class="bg-gray-50 rounded-lg p-4">
    <h4 class="text-sm font-medium text-gray-900 mb-3">Summary</h4>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900">{results.totalRecords.toLocaleString()}</div>
        <div class="text-sm text-gray-500">Total Rows</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{results.successfulRecords.toLocaleString()}</div>
        <div class="text-sm text-gray-500">{validateOnly ? 'Valid' : 'Successful'}</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-red-600">{results.failedRecords.toLocaleString()}</div>
        <div class="text-sm text-gray-500">{validateOnly ? 'Invalid' : 'Failed'}</div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{successRate}%</div>
        <div class="text-sm text-gray-500">Success Rate</div>
      </div>
    </div>

    <!-- Additional Summary Info -->
    {#if results.summary}
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="grid grid-cols-3 gap-4 text-center">
          {#if results.summary.created}
            <div>
              <div class="text-lg font-medium text-green-600">{results.summary.created.toLocaleString()}</div>
              <div class="text-xs text-gray-500">Created</div>
            </div>
          {/if}
          {#if results.summary.updated}
            <div>
              <div class="text-lg font-medium text-blue-600">{results.summary.updated.toLocaleString()}</div>
              <div class="text-xs text-gray-500">Updated</div>
            </div>
          {/if}
          {#if results.summary.skipped}
            <div>
              <div class="text-lg font-medium text-gray-600">{results.summary.skipped.toLocaleString()}</div>
              <div class="text-xs text-gray-500">Skipped</div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Processing Time -->
    {#if results.duration}
      <div class="mt-3 text-center text-sm text-gray-500">
        Completed in {Math.round(results.duration / 1000)} seconds
      </div>
    {/if}
  </div>

  <!-- Error Details -->
  {#if hasErrors}
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium text-gray-900">Error Details</h4>
        <button
          on:click={downloadErrorReport}
          class="text-sm text-blue-600 hover:text-blue-500 underline"
        >
          Download Error Report
        </button>
      </div>

      <!-- Error Summary by Type -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {#each Object.entries(errorGroups) as [errorType, errors]}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <div class="text-sm font-medium text-red-800 capitalize">{errorType} Errors</div>
            <div class="text-lg font-bold text-red-900">{errors.length}</div>
          </div>
        {/each}
      </div>

      <!-- Recent Errors List -->
      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h5 class="text-sm font-medium text-gray-900">
            Recent Errors (showing first 10)
          </h5>
        </div>
        
        <div class="max-h-60 overflow-y-auto">
          <div class="divide-y divide-gray-200">
            {#each results.errors.slice(0, 10) as error}
              <div class="px-4 py-3">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">
                      Row {error.rowNumber}
                      {#if error.fieldName}
                        - {error.fieldName}
                      {/if}
                    </div>
                    <div class="text-sm text-red-600 mt-1">{error.errorMessage}</div>
                  </div>
                  <div class="ml-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">
                      {error.errorType}
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        {#if results.errors.length > 10}
          <div class="bg-gray-50 px-4 py-2 text-xs text-gray-500">
            And {results.errors.length - 10} more errors. Download the full error report for details.
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Next Steps -->
  {#if validateOnly && isSuccess}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-blue-800">Ready for Import</h4>
          <p class="text-sm text-blue-700 mt-1">
            Your data has passed validation! You can now proceed with the actual import by restarting the process and unchecking "Validation Only".
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="flex flex-col sm:flex-row gap-3 pt-6">
    {#if validateOnly && (isSuccess || isPartialSuccess)}
      <button
        on:click={handleRestart}
        class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Proceed with Import
      </button>
    {:else if !validateOnly && (isSuccess || isPartialSuccess)}
      <button
        on:click={handleClose}
        class="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Close
      </button>
    {/if}

    {#if isFailed || (isPartialSuccess && results.failedRecords > 0)}
      <button
        on:click={handleRestart}
        class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Try Again
      </button>
    {/if}

    <button
      on:click={handleClose}
      class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {validateOnly && (isSuccess || isPartialSuccess) ? 'Cancel' : 'Close'}
    </button>
  </div>
</div>
