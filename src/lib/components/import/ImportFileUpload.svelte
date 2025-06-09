<!-- src/lib/components/import/ImportFileUpload.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CSVProcessor } from '$lib/services/csvProcessor';
  import { TemplateService } from '$lib/services/templateService';
  import type { ParsedCSVData } from '$lib/types/import';

  export let importType: 'contacts' | 'businesses' | 'donations';

  const dispatch = createEventDispatcher();
  
  let fileInput: HTMLInputElement;
  let isDragOver = false;
  let isProcessing = false;
  let uploadError = '';
  let selectedFile: File | null = null;

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }

  async function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      await processFile(file);
    }
  }

  async function processFile(file: File) {
    uploadError = '';
    selectedFile = file;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      uploadError = 'Please select a CSV file (.csv)';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      uploadError = 'File size must be less than 10MB';
      return;
    }

    isProcessing = true;

    try {
      const parsedData: ParsedCSVData = await CSVProcessor.parseFile(file);
      
      if (parsedData.errors.length > 0) {
        uploadError = `CSV parsing errors: ${parsedData.errors.map(e => e.message).join(', ')}`;
        return;
      }

      if (parsedData.data.length === 0) {
        uploadError = 'CSV file appears to be empty';
        return;
      }

      // Dispatch success event
      dispatch('fileUploaded', {
        file,
        data: parsedData
      });

    } catch (error) {
      console.error('Error processing file:', error);
      uploadError = 'Error processing file. Please check the file format and try again.';
    } finally {
      isProcessing = false;
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function downloadTemplate() {
    TemplateService.downloadTemplate(importType);
  }

  function clearFile() {
    selectedFile = null;
    uploadError = '';
    if (fileInput) {
      fileInput.value = '';
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      Upload CSV File
    </h3>
    <p class="text-sm text-gray-600">
      Upload a CSV file containing your {importType} data to begin the import process.
    </p>
  </div>

  <!-- Template Download -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h4 class="text-sm font-medium text-blue-800">
          Need a template?
        </h4>
        <p class="text-sm text-blue-700 mt-1">
          Download our CSV template with sample data and field descriptions to ensure your file is formatted correctly.
        </p>
        <button
          on:click={downloadTemplate}
          class="mt-2 text-sm font-medium text-blue-800 hover:text-blue-600 underline"
        >
          Download {importType} template
        </button>
      </div>
    </div>
  </div>

  <!-- File Upload Area -->
  <div class="space-y-4">
    <!-- Drag and Drop Area -->
    <div
      class="relative border-2 border-dashed rounded-lg p-6 transition-colors {isDragOver 
        ? 'border-blue-400 bg-blue-50' 
        : 'border-gray-300 hover:border-gray-400'} {uploadError ? 'border-red-300 bg-red-50' : ''}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleFileDrop}
      role="button"
      tabindex="0"
    >
      <div class="text-center">
        {#if isProcessing}
          <!-- Processing State -->
          <div class="flex flex-col items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p class="text-sm text-gray-600">Processing file...</p>
          </div>
        {:else if selectedFile && !uploadError}
          <!-- File Selected State -->
          <div class="flex flex-col items-center">
            <svg class="h-8 w-8 text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm font-medium text-gray-900">{selectedFile.name}</p>
            <p class="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            <button
              on:click={clearFile}
              class="mt-2 text-sm text-red-600 hover:text-red-500"
            >
              Remove file
            </button>
          </div>
        {:else}
          <!-- Default Upload State -->
          <div class="flex flex-col items-center">
            <svg class="h-8 w-8 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="text-sm font-medium text-gray-900">
              Drop your CSV file here, or 
              <button
                on:click={() => fileInput?.click()}
                class="text-blue-600 hover:text-blue-500 underline"
              >
                browse
              </button>
            </p>
            <p class="text-xs text-gray-500 mt-1">
              CSV files up to 10MB
            </p>
          </div>
        {/if}
      </div>

      <!-- Hidden File Input -->
      <input
        bind:this={fileInput}
        type="file"
        accept=".csv"
        on:change={handleFileSelect}
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>

    <!-- Error Message -->
    {#if uploadError}
      <div class="bg-red-50 border border-red-200 rounded-md p-3">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{uploadError}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- File Requirements -->
    <div class="text-xs text-gray-500 space-y-1">
      <p><strong>File Requirements:</strong></p>
      <ul class="list-disc list-inside space-y-1 ml-2">
        <li>CSV format (.csv)</li>
        <li>Maximum file size: 10MB</li>
        <li>First row must contain column headers</li>
        <li>Use our template for best results</li>
      </ul>
    </div>
  </div>
</div>
