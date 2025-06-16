<!-- src/lib/components/import/ImportPreview.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CSVProcessor } from '$lib/services/csvProcessor';
  import { IMPORT_CONFIGS } from '$lib/config/importConfigs';
  import type { ParsedCSVData, ImportConfig } from '$lib/types/import';

  export let parsedData: ParsedCSVData;
  export let importType: 'contacts' | 'businesses' | 'donations';

  const dispatch = createEventDispatcher();
  
  let validationResults: any = null;
  let isValidating = false;
  
  // More defensive handling of config loading
  $: {
    console.log('ImportPreview reactive block:', {
      importType,
      IMPORT_CONFIGS: Object.keys(IMPORT_CONFIGS),
      hasBusinessConfig: !!IMPORT_CONFIGS['businesses'],
      configValue: IMPORT_CONFIGS[importType]
    });
  }
  
  // Use a computed config with thorough defaults
  $: config = (() => {
    const baseConfig = IMPORT_CONFIGS[importType];
    
    if (!baseConfig) {
      console.warn(`No import config found for type: ${importType}`);
      return {
        type: importType,
        requiredFields: [],
        optionalFields: [],
        validationRules: {},
        displayName: importType.charAt(0).toUpperCase() + importType.slice(1),
        description: `Import ${importType}`,
        duplicateDetectionFields: [],
        relatedEntities: {}
      } as ImportConfig;
    }
    
    // Ensure all required properties exist
    return {
      type: baseConfig.type || importType,
      requiredFields: baseConfig.requiredFields || [],
      optionalFields: baseConfig.optionalFields || [],
      validationRules: baseConfig.validationRules || {},
      displayName: baseConfig.displayName || importType.charAt(0).toUpperCase() + importType.slice(1),
      description: baseConfig.description || `Import ${importType}`,
      duplicateDetectionFields: baseConfig.duplicateDetectionFields || [],
      relatedEntities: baseConfig.relatedEntities || {}
    } as ImportConfig;
  })();
  $: previewData = parsedData.data.slice(0, 5); // Show first 5 rows
  
  async function validateData() {
    isValidating = true;
    
    try {
      console.log('Starting validation with config:', config);
      
      // Create a simple field mapping for validation (1:1 mapping for matching field names)
      const fieldMapping: Record<string, string> = {};
      
      // Early return if config is not properly loaded
      if (!config || (!config.requiredFields && !config.optionalFields)) {
        console.warn('Config not ready for validation, creating default validation result');
        validationResults = {
          validRows: [],
          invalidRows: [],
          duplicates: []
        };
        return;
      }
      
      // Improved field mapping logic
      parsedData.headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        const allFields = [...(config.requiredFields || []), ...(config.optionalFields || [])];
        
        // Skip if no fields are available
        if (allFields.length === 0) {
          return;
        }
        
        // Define common mappings
        const commonMappings: Record<string, string> = {
          'vanid': 'vanid',
          'lastname': 'lastName',
          'firstname': 'firstName', 
          'middlename': 'middleName',
          'phone': 'phoneNumbers',
          'email': 'emails',
          'vaddress': 'addresses',
          'address': 'addresses',
          'businessname': 'businessName',
          'amount': 'amount'
        };
        
        // Check common mappings first
        if (commonMappings[normalizedHeader]) {
          const targetField = commonMappings[normalizedHeader];
          if (allFields.includes(targetField)) {
            fieldMapping[header] = targetField;
            return;
          }
        }
        
        // Find exact matches
        const exactMatch = allFields.find(field => 
          field.toLowerCase() === normalizedHeader
        );
        
        if (exactMatch) {
          fieldMapping[header] = exactMatch;
        } else {
          // Try partial matches
          const partialMatch = allFields.find(field => {
            const fieldNormalized = field.toLowerCase();
            return fieldNormalized.includes(normalizedHeader) || 
                   normalizedHeader.includes(fieldNormalized);
          });
          
          if (partialMatch) {
            fieldMapping[header] = partialMatch;
          }
        }
      });
      
      console.log('Field mapping for preview validation:', fieldMapping);
      
      // Only validate if we have a valid config and some field mappings
      if (config && Object.keys(fieldMapping).length > 0) {
        validationResults = CSVProcessor.validateData(
          parsedData.data, 
          config, 
          fieldMapping
        );
      } else {
        // If no mappings found, create a default result that allows proceeding
        validationResults = {
          validRows: [],
          invalidRows: [],
          duplicates: []
        };
      }
      
      console.log('Validation results:', validationResults);
    } catch (error) {
      console.error('Validation error:', error);
      // Create a default result that allows proceeding even if validation fails
      validationResults = {
        validRows: [],
        invalidRows: [],
        duplicates: []
      };
    } finally {
      isValidating = false;
    }
  }

  function handleNext() {
    console.log('ImportPreview handleNext called, dispatching "next" event');
    dispatch('next');
  }

  function handleBack() {
    dispatch('back');
  }

  // Validate data when component loads
  validateData();
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      Data Preview
    </h3>
    <p class="text-sm text-gray-600">
      Review your CSV data and validation results before proceeding.
    </p>
  </div>

  <!-- File Summary -->
  <div class="bg-gray-50 rounded-lg p-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="text-center">
        <div class="font-medium text-gray-900">{parsedData.totalRows}</div>
        <div class="text-gray-500">Total Rows</div>
      </div>
      <div class="text-center">
        <div class="font-medium text-gray-900">{parsedData.headers.length}</div>
        <div class="text-gray-500">Columns</div>
      </div>
      <div class="text-center">
        <div class="font-medium {validationResults?.validRows.length > 0 ? 'text-green-600' : 'text-gray-900'}">
          {validationResults?.validRows.length || 0}
        </div>
        <div class="text-gray-500">Valid Rows</div>
      </div>
      <div class="text-center">
        <div class="font-medium {validationResults?.invalidRows.length > 0 ? 'text-red-600' : 'text-gray-900'}">
          {validationResults?.invalidRows.length || 0}
        </div>
        <div class="text-gray-500">Invalid Rows</div>
      </div>
    </div>
  </div>

  <!-- Validation Status -->
  {#if isValidating}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
        <span class="text-sm text-blue-800">Validating data...</span>
      </div>
    </div>
  {:else if validationResults}
    <div class="space-y-4">
      <!-- Validation Summary -->
      {#if validationResults.validRows.length === 0 && validationResults.invalidRows.length === 0}
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h4 class="text-sm font-medium text-blue-800">
                Ready for Field Mapping
              </h4>
              <p class="text-sm text-blue-700 mt-1">
                Your CSV file has been successfully parsed. Proceed to the next step to map your CSV columns to the correct database fields.
              </p>
            </div>
          </div>
        </div>
      {:else if validationResults.invalidRows.length > 0}
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h4 class="text-sm font-medium text-yellow-800">
                Validation Issues Found
              </h4>
              <p class="text-sm text-yellow-700 mt-1">
                {validationResults.invalidRows.length} row(s) have validation errors. 
                You can still proceed, but these rows will be skipped during import.
              </p>
            </div>
          </div>
        </div>
      {:else}
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-green-800">
                Data Validation Passed
              </h4>
              <p class="text-sm text-green-700">
                All rows passed validation and are ready for import.
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Data Preview Table -->
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h4 class="text-sm font-medium text-gray-900">Data Preview (First 5 rows)</h4>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
            {#each parsedData.headers as header}
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {header}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each previewData as row, index}
            <tr class="{validationResults && validationResults.invalidRows.find(invalid => invalid.rowNumber === index + 1) ? 'bg-red-50' : ''}">
              <td class="px-4 py-2 text-sm text-gray-500">
                {index + 1}
                {#if validationResults && validationResults.invalidRows.find(invalid => invalid.rowNumber === index + 1)}
                  <span class="ml-1 text-red-500" title="Validation errors">⚠</span>
                {/if}
              </td>
              {#each parsedData.headers as header}
                <td class="px-4 py-2 text-sm text-gray-900 max-w-xs truncate" title="{row[header] || ''}">
                  {row[header] || ''}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    {#if parsedData.data.length > 5}
      <div class="bg-gray-50 px-4 py-2 text-xs text-gray-500">
        Showing first 5 of {parsedData.data.length} rows
      </div>
    {/if}
  </div>

  <!-- Validation Errors Details -->
  {#if validationResults && validationResults.invalidRows.length > 0}
    <div class="border border-red-200 rounded-lg overflow-hidden">
      <div class="bg-red-50 px-4 py-3 border-b border-red-200">
        <h4 class="text-sm font-medium text-red-800">Validation Errors</h4>
      </div>
      
      <div class="max-h-60 overflow-y-auto">
        <div class="divide-y divide-red-200">
          {#each validationResults.invalidRows.slice(0, 10) as invalidRow}
            <div class="px-4 py-3">
              <div class="text-sm font-medium text-red-800">Row {invalidRow.rowNumber}</div>
              <ul class="mt-1 text-sm text-red-700 list-disc list-inside">
                {#each invalidRow.errors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </div>
      
      {#if validationResults.invalidRows.length > 10}
        <div class="bg-red-50 px-4 py-2 text-xs text-red-600">
          Showing first 10 of {validationResults.invalidRows.length} validation errors
        </div>
      {/if}
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
      disabled={!validationResults || isValidating}
      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Continue to Field Mapping
    </button>
  </div>
</div>
