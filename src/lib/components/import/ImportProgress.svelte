<!-- src/lib/components/import/ImportProgress.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import type { ImportProgress } from '$lib/types/import';

  export let sessionId: string;
  export let validateOnly: boolean = false;

  const dispatch = createEventDispatcher();
  
  let progress: ImportProgress | null = null;
  let isComplete = false;
  let error: string | null = null;
  let progressInterval: NodeJS.Timeout | null = null;

  $: progressPercentage = progress ? Math.round((progress.processedRecords / progress.totalRecords) * 100) : 0;
  
  async function fetchProgress() {
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_progress',
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      const data = await response.json();
      progress = data.progress;

      // Check if import is complete
      if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
        isComplete = true;
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        
        dispatch('complete', {
          sessionId,
          success: progress.status === 'completed',
          results: progress
        });
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      error = err instanceof Error ? err.message : 'Unknown error';
      
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }
  }

  async function cancelImport() {
    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'cancel_session',
          sessionId
        })
      });

      if (response.ok) {
        dispatch('cancelled');
      }
    } catch (err) {
      console.error('Error cancelling import:', err);
    }
  }

  onMount(() => {
    // Start polling for progress
    fetchProgress();
    progressInterval = setInterval(fetchProgress, 2000); // Poll every 2 seconds
  });

  onDestroy(() => {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  });
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      {validateOnly ? 'Validating Data' : 'Importing Data'}
    </h3>
    <p class="text-sm text-gray-600">
      {validateOnly 
        ? 'Running validation checks on your data...' 
        : 'Processing your import. This may take a few minutes.'}
    </p>
  </div>

  {#if error}
    <!-- Error State -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h4 class="text-lg font-medium text-red-900 mb-2">Import Failed</h4>
      <p class="text-red-700">{error}</p>
      <button
        on:click={() => dispatch('restart')}
        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  {:else if isComplete}
    <!-- Complete State -->
    <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
      <svg class="mx-auto h-12 w-12 text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 48 48">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h4 class="text-lg font-medium text-green-900 mb-2">
        {validateOnly ? 'Validation Complete' : 'Import Complete'}
      </h4>
      <p class="text-green-700">
        {validateOnly 
          ? 'Data validation has finished. Check the results below.' 
          : 'Your data has been successfully imported.'}
      </p>
    </div>
  {:else}
    <!-- Progress State -->
    <div class="space-y-4">
      <!-- Progress Bar -->
      <div>
        <div class="flex justify-between text-sm text-gray-700 mb-2">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style="width: {progressPercentage}%"
          ></div>
        </div>
      </div>

      <!-- Status Information -->
      {#if progress}
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="text-center">
              <div class="font-medium text-gray-900">{progress.processedRecords.toLocaleString()}</div>
              <div class="text-gray-500">Processed</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-green-600">{progress.successfulRecords.toLocaleString()}</div>
              <div class="text-gray-500">Successful</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-red-600">{progress.failedRecords.toLocaleString()}</div>
              <div class="text-gray-500">Failed</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-gray-900">{progress.totalRecords.toLocaleString()}</div>
              <div class="text-gray-500">Total</div>
            </div>
          </div>

          <!-- Current Batch Info -->
          {#if progress.currentBatch && progress.totalBatches}
            <div class="mt-3 pt-3 border-t border-gray-200 text-center">
              <div class="text-sm text-gray-600">
                Batch {progress.currentBatch} of {progress.totalBatches}
              </div>
            </div>
          {/if}
        </div>

        <!-- Recent Errors -->
        {#if progress.errors && progress.errors.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-red-800 mb-2">Recent Errors</h4>
            <div class="max-h-32 overflow-y-auto space-y-1">
              {#each progress.errors.slice(-5) as error}
                <div class="text-xs text-red-700">
                  Row {error.rowNumber}: {error.errorMessage}
                </div>
              {/each}
            </div>
            {#if progress.errors.length > 5}
              <div class="text-xs text-red-600 mt-2">
                And {progress.errors.length - 5} more errors...
              </div>
            {/if}
          </div>
        {/if}
      {:else}
        <!-- Loading State -->
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Starting {validateOnly ? 'validation' : 'import'}...</p>
        </div>
      {/if}

      <!-- Cancel Button -->
      {#if !isComplete && !error}
        <div class="text-center">
          <button
            on:click={cancelImport}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancel {validateOnly ? 'Validation' : 'Import'}
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Live Updates Indicator -->
  {#if !isComplete && !error}
    <div class="flex items-center justify-center text-xs text-gray-500">
      <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
      Live updates every 2 seconds
    </div>
  {/if}
</div>
