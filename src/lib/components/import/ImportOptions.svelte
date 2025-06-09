<!-- src/lib/components/import/ImportOptions.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { IMPORT_CONFIGS } from '$lib/config/importConfigs';
  import type { ParsedCSVData, ImportOptions } from '$lib/types/import';

  export let importType: 'contacts' | 'businesses' | 'donations';
  export let parsedData: ParsedCSVData;

  const dispatch = createEventDispatcher();

  $: {
    console.log('ImportOptions - importType:', importType);
    console.log('ImportOptions - IMPORT_CONFIGS:', IMPORT_CONFIGS);
  }
  $: config = IMPORT_CONFIGS[importType] || { duplicateDetectionFields: [] };
  
  // Initialize options with proper reactive defaults
  $: defaultDuplicateField = config && config.duplicateDetectionFields && config.duplicateDetectionFields.length > 0 
    ? config.duplicateDetectionFields[0] 
    : '';
    
  let options: ImportOptions = {
    mode: 'create_only',
    duplicateField: '',
    batchSize: 100,
    skipEmptyRows: true,
    validateOnly: false
  };

  // Update duplicate field when config changes
  $: if (config && config.duplicateDetectionFields && !options.duplicateField) {
    options.duplicateField = config.duplicateDetectionFields[0] || '';
  }

  function handleNext() {
    dispatch('next', options);
  }

  function handleBack() {
    dispatch('back');
  }

  function handleModeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    options.mode = target.value as 'create_only' | 'update_or_create';
  }

  function handleDuplicateFieldChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    options.duplicateField = target.value;
  }

  function handleBatchSizeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    options.batchSize = parseInt(target.value, 10);
  }

  function handleValidateOnlyChange(event: Event) {
    const target = event.target as HTMLInputElement;
    options.validateOnly = target.checked;
  }

  function handleSkipEmptyRowsChange(event: Event) {
    const target = event.target as HTMLInputElement;
    options.skipEmptyRows = target.checked;
  }

  // Estimate processing time based on data size and batch size
  $: estimatedBatches = Math.ceil(parsedData.totalRows / options.batchSize);
  $: estimatedTime = Math.max(1, Math.ceil(estimatedBatches * 2)); // Rough estimate: 2 seconds per batch
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      Import Options
    </h3>
    <p class="text-sm text-gray-600">
      Configure how your data should be imported and processed.
    </p>
  </div>

  <!-- Import Mode -->
  <div class="space-y-4">
    <div>
      <h4 class="text-sm font-medium text-gray-900 mb-3">Import Mode</h4>
      <div class="space-y-3">
        <label class="flex items-start space-x-3 cursor-pointer">
          <input
            type="radio"
            name="importMode"
            value="create_only"
            checked={options.mode === 'create_only'}
            on:change={handleModeChange}
            class="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">Create Only</div>
            <div class="text-xs text-gray-500">
              Only create new records. Skip any rows that match existing records.
            </div>
          </div>
        </label>
        
        <label class="flex items-start space-x-3 cursor-pointer">
          <input
            type="radio"
            name="importMode"
            value="update_or_create"
            checked={options.mode === 'update_or_create'}
            on:change={handleModeChange}
            class="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">Update or Create</div>
            <div class="text-xs text-gray-500">
              Update existing records if found, otherwise create new ones.
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- Duplicate Detection Field -->
    {#if options.mode === 'update_or_create' && config && config.duplicateDetectionFields && config.duplicateDetectionFields.length > 0}
      <div>
        <label for="duplicateField" class="block text-sm font-medium text-gray-900 mb-2">
          Duplicate Detection Field
        </label>
        <select
          id="duplicateField"
          bind:value={options.duplicateField}
          on:change={handleDuplicateFieldChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {#each config.duplicateDetectionFields as field}
            <option value={field}>{field}</option>
          {/each}
        </select>
        <p class="mt-1 text-xs text-gray-500">
          Field used to identify existing records for updates.
        </p>
      </div>
    {/if}

    <!-- Processing Options -->
    <div>
      <h4 class="text-sm font-medium text-gray-900 mb-3">Processing Options</h4>
      <div class="space-y-3">
        <!-- Batch Size -->
        <div>
          <label for="batchSize" class="block text-sm font-medium text-gray-700 mb-1">
            Batch Size
          </label>
          <select
            id="batchSize"
            bind:value={options.batchSize}
            on:change={handleBatchSizeChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={50}>50 rows per batch</option>
            <option value={100}>100 rows per batch (Recommended)</option>
            <option value={200}>200 rows per batch</option>
            <option value={500}>500 rows per batch</option>
          </select>
          <p class="mt-1 text-xs text-gray-500">
            Smaller batches are more reliable but slower. Larger batches are faster but may fail more easily.
          </p>
        </div>

        <!-- Skip Empty Rows -->
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.skipEmptyRows}
            on:change={handleSkipEmptyRowsChange}
            class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">Skip Empty Rows</div>
            <div class="text-xs text-gray-500">
              Automatically skip rows where all mapped fields are empty.
            </div>
          </div>
        </label>

        <!-- Validate Only -->
        <label class="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.validateOnly}
            on:change={handleValidateOnlyChange}
            class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-900">Validation Only</div>
            <div class="text-xs text-gray-500">
              Run validation and duplicate checking without actually importing data.
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>

  <!-- Import Summary -->
  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <h4 class="text-sm font-medium text-gray-900 mb-3">Import Summary</h4>
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <div class="text-gray-500">Total Rows</div>
        <div class="font-medium">{parsedData.totalRows.toLocaleString()}</div>
      </div>
      <div>
        <div class="text-gray-500">Batch Count</div>
        <div class="font-medium">{estimatedBatches.toLocaleString()}</div>
      </div>
      <div>
        <div class="text-gray-500">Import Mode</div>
        <div class="font-medium">
          {options.mode === 'create_only' ? 'Create Only' : 'Update or Create'}
        </div>
      </div>
      <div>
        <div class="text-gray-500">Estimated Time</div>
        <div class="font-medium">
          {#if options.validateOnly}
            ~{Math.ceil(estimatedTime / 2)} seconds
          {:else}
            ~{estimatedTime} seconds
          {/if}
        </div>
      </div>
    </div>
    
    {#if options.mode === 'update_or_create' && config && config.duplicateDetectionFields && options.duplicateField}
      <div class="mt-3 pt-3 border-t border-gray-200">
        <div class="text-sm">
          <span class="text-gray-500">Duplicate Detection:</span>
          <span class="font-medium">{options.duplicateField}</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Warning for Large Imports -->
  {#if parsedData.totalRows > 1000}
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-yellow-800">Large Import Detected</h4>
          <p class="text-sm text-yellow-700 mt-1">
            You're importing {parsedData.totalRows.toLocaleString()} rows. Large imports may take several minutes to complete. 
            Consider using "Validation Only" first to check for issues before proceeding with the full import.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Validation Only Warning -->
  {#if options.validateOnly}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-blue-800">Validation Mode</h4>
          <p class="text-sm text-blue-700 mt-1">
            Running in validation-only mode. No data will be imported, but you'll see a full report 
            of any issues, duplicates, and validation errors.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Navigation Buttons -->
  <div class="flex justify-between pt-6">
    <button
      on:click={handleBack}
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Back
    </button>
    
    <button
      on:click={handleNext}
      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {options.validateOnly ? 'Start Validation' : 'Start Import'}
    </button>
  </div>
</div>
