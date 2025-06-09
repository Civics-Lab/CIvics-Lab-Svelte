<!-- src/lib/components/import/ImportModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ImportStepIndicator from './ImportStepIndicator.svelte';
  import ImportFileUpload from './ImportFileUpload.svelte';
  import ImportPreview from './ImportPreview.svelte';
  import ImportFieldMapping from './ImportFieldMapping.svelte';
  import ImportOptions from './ImportOptions.svelte';
  import ImportProgress from './ImportProgress.svelte';
  import ImportResults from './ImportResults.svelte';
  import type { 
    ParsedCSVData, 
    ImportOptions as ImportOptionsType,
    ImportStep,
    ImportResults as ImportResultsType
  } from '$lib/types/import';

  export let isOpen = false;
  export let importType: 'contacts' | 'businesses' | 'donations';
  export let workspaceId: string;

  const dispatch = createEventDispatcher();
  
  let currentStep = 1;
  let uploadedFile: File | null = null;
  let parsedData: ParsedCSVData | null = null;
  let fieldMapping: Record<string, string> = {};
  let importOptions: ImportOptionsType | null = null;
  let importSessionId: string | null = null;
  let importResults: ImportResultsType | null = null;

  const steps: ImportStep[] = [
    { number: 1, title: 'Upload File', description: 'Choose CSV file to import' },
    { number: 2, title: 'Preview Data', description: 'Review and validate data' },
    { number: 3, title: 'Map Fields', description: 'Map CSV columns to database fields' },
    { number: 4, title: 'Configure Options', description: 'Set import preferences' },
    { number: 5, title: 'Import Progress', description: 'Processing your data' },
    { number: 6, title: 'Results', description: 'Import summary and errors' }
  ];

  function handleClose() {
    resetModal();
    dispatch('close');
  }

  function resetModal() {
    currentStep = 1;
    uploadedFile = null;
    parsedData = null;
    fieldMapping = {};
    importOptions = null;
    importSessionId = null;
    importResults = null;
  }

  function handleFileUploaded(event: CustomEvent) {
    uploadedFile = event.detail.file;
    parsedData = event.detail.data;
    currentStep = 2;
  }

  function handlePreviewNext() {
    console.log('handlePreviewNext called, setting currentStep to 3');
    console.log('parsedData:', parsedData);
    currentStep = 3;
  }

  function handlePreviewBack() {
    currentStep = 1;
  }

  function handleMappingNext(event: CustomEvent) {
    console.log('handleMappingNext called with event:', event);
    console.log('event.detail:', event.detail);
    fieldMapping = event.detail;
    console.log('Setting currentStep to 4');
    currentStep = 4;
  }

  function handleMappingBack() {
    currentStep = 2;
  }

  function handleOptionsNext(event: CustomEvent) {
    importOptions = event.detail;
    currentStep = 5;
    startImport();
  }

  function handleOptionsBack() {
    currentStep = 3;
  }

  async function startImport() {
    if (!parsedData || !importOptions || !uploadedFile) {
      console.error('Missing required data for import');
      return;
    }

    try {
      // Create import session
      const sessionResponse = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_session',
          workspaceId,
          importType,
          filename: uploadedFile.name,
          totalRecords: parsedData.totalRows,
          importMode: importOptions.mode,
          duplicateField: importOptions.duplicateField,
          fieldMapping,
          validateOnly: importOptions.validateOnly
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create import session');
      }

      const sessionData = await sessionResponse.json();
      importSessionId = sessionData.sessionId;

      // Start processing batches
      await processBatches();

    } catch (error) {
      console.error('Error starting import:', error);
      // Handle error - maybe show error state
    }
  }

  async function processBatches() {
    if (!parsedData || !importOptions || !importSessionId) return;

    const batchSize = importOptions.batchSize;
    const totalBatches = Math.ceil(parsedData.totalRows / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, parsedData.totalRows);
      const batchData = parsedData.data.slice(startIndex, endIndex);

      console.log(`Processing batch ${batchIndex + 1}/${totalBatches}:`, {
        startIndex,
        endIndex,
        batchSize: batchData.length,
        sampleData: batchData[0]
      });

      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'process_batch',
            sessionId: importSessionId,
            batchData,
            startIndex,
            batchNumber: batchIndex + 1,
            totalBatches
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Batch ${batchIndex + 1} failed with status ${response.status}:`, errorText);
          throw new Error(`Batch ${batchIndex + 1} failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log(`Batch ${batchIndex + 1} completed:`, result);

        // Short delay between batches to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error);
        // Log the batch data that caused the error
        console.error('Failed batch data sample:', {
          batchIndex: batchIndex + 1,
          startIndex,
          endIndex,
          sampleRows: batchData.slice(0, 3),
          fieldMapping
        });
        // Continue with next batch or stop processing
        break;
      }
    }
  }

  function handleImportComplete(event: CustomEvent) {
    importResults = event.detail.results;
    currentStep = 6;
  }

  function handleImportCancelled() {
    // Reset to options step
    currentStep = 4;
    importSessionId = null;
  }

  function handleResultsClose() {
    handleClose();
    // Dispatch event to refresh data in parent component
    dispatch('importComplete', {
      success: importResults?.status === 'completed',
      importType,
      totalRecords: importResults?.totalRecords || 0,
      successfulRecords: importResults?.successfulRecords || 0
    });
  }

  function handleResultsRestart() {
    if (importOptions?.validateOnly) {
      // If was validation only, go back to options and uncheck validate only
      importOptions.validateOnly = false;
      currentStep = 4;
    } else {
      // Full restart
      currentStep = 1;
    }
    importSessionId = null;
    importResults = null;
  }

  // Handle escape key to close modal
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        on:click={handleClose}
        aria-hidden="true"
      ></div>
      
      <!-- Modal panel -->
      <div class="relative inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              Import {importType.charAt(0).toUpperCase() + importType.slice(1)}
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              Import data from CSV file into your workspace
            </p>
          </div>
          <button 
            on:click={handleClose}
            class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
            aria-label="Close"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Step Indicator -->
        <div class="py-4">
          <ImportStepIndicator {currentStep} {steps} />
        </div>

        <!-- Content -->
        <div class="py-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          
          {#if currentStep === 1}
            <ImportFileUpload 
              {importType} 
              on:fileUploaded={handleFileUploaded} 
            />
          {:else if currentStep === 2 && parsedData}
            <ImportPreview 
              {parsedData} 
              {importType} 
              on:next={(e) => {
                console.log('ImportModal received "next" event from ImportPreview:', e);
                handlePreviewNext();
              }}
              on:back={handlePreviewBack}
            />
          {:else if currentStep === 3 && parsedData}
            <ImportFieldMapping 
              {parsedData}
              {importType}
              on:next={handleMappingNext}
              on:back={handleMappingBack}
            />
          {:else if currentStep === 4 && parsedData}
            <div class="text-xs text-gray-500 mb-2 p-2 bg-yellow-100 rounded">
              Showing ImportOptions component
            </div>
            <ImportOptions 
              {importType}
              {parsedData}
              on:next={handleOptionsNext}
              on:back={handleOptionsBack}
            />
          {:else if currentStep === 5 && importSessionId}
            <ImportProgress 
              sessionId={importSessionId}
              validateOnly={importOptions?.validateOnly || false}
              on:complete={handleImportComplete}
              on:cancelled={handleImportCancelled}
            />
          {:else if currentStep === 6 && importResults}
            <ImportResults 
              results={importResults}
              validateOnly={importOptions?.validateOnly || false}
              on:close={handleResultsClose}
              on:restart={handleResultsRestart}
            />
          {:else}
            <!-- Fallback content -->
            <div class="text-center py-8">
              <p class="text-gray-500">Loading... (currentStep: {currentStep}, parsedData: {!!parsedData})</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
