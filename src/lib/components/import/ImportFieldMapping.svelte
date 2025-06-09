<!-- src/lib/components/import/ImportFieldMapping.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { IMPORT_CONFIGS, FIELD_DISPLAY_NAMES, FIELD_DESCRIPTIONS } from '$lib/config/importConfigs';
  import type { ParsedCSVData, ImportFieldMapping } from '$lib/types/import';

  export let parsedData: ParsedCSVData;
  export let importType: 'contacts' | 'businesses' | 'donations';

  const dispatch = createEventDispatcher();
  
  $: {
    console.log('ImportFieldMapping - importType:', importType);
    console.log('ImportFieldMapping - IMPORT_CONFIGS:', IMPORT_CONFIGS);
    console.log('ImportFieldMapping - config:', IMPORT_CONFIGS[importType]);
  }
  $: config = IMPORT_CONFIGS[importType] || { requiredFields: [], optionalFields: [] };
  $: fieldDisplayNames = FIELD_DISPLAY_NAMES[importType] || {};
  $: fieldDescriptions = FIELD_DESCRIPTIONS[importType] || {};
  
  let fieldMapping: Record<string, string> = {};
  let mappingErrors: string[] = [];
  let initialized = false;
  
  // Available database fields for mapping
  $: {
    console.log('ImportFieldMapping - building availableFields');
    console.log('config:', config);
    console.log('config.requiredFields:', config?.requiredFields);
    console.log('config.optionalFields:', config?.optionalFields);
  }
  $: availableFields = (function() {
    if (!config || !config.requiredFields || !config.optionalFields) {
      console.log('Config not ready, returning empty availableFields');
      return [];
    }
    
    const fields = [...config.requiredFields, ...config.optionalFields].map(field => ({
      value: field,
      label: fieldDisplayNames[field] || field,
      description: fieldDescriptions[field] || '',
      required: config.requiredFields.includes(field)
    }));
    
    console.log('Built availableFields:', fields);
    return fields;
  })();

  // Initialize field mapping with automatic suggestions
  function initializeMapping() {
    console.log('initializeMapping called');
    console.log('availableFields:', availableFields);
    console.log('initialized flag:', initialized);
    
    if (!availableFields || availableFields.length === 0) {
      console.log('No available fields, skipping initialization');
      return;
    }
    
    if (initialized) {
      console.log('Already initialized, skipping');
      return;
    }
    
    const mapping: Record<string, string> = {};
    
    parsedData.headers.forEach(csvHeader => {
      // Try to find exact matches first
      const normalizedCsvHeader = csvHeader.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const exactMatch = availableFields.find(field => 
        field && field.value && (
          field.value.toLowerCase() === normalizedCsvHeader ||
          field.label.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedCsvHeader
        )
      );
      
      if (exactMatch) {
        mapping[csvHeader] = exactMatch.value;
        return;
      }
      
      // Try partial matches
      const partialMatch = availableFields.find(field => {
        if (!field || !field.value) return false;
        
        const fieldName = field.value.toLowerCase();
        const fieldLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        return fieldName.includes(normalizedCsvHeader) || 
               normalizedCsvHeader.includes(fieldName) ||
               fieldLabel.includes(normalizedCsvHeader) ||
               normalizedCsvHeader.includes(fieldLabel);
      });
      
      if (partialMatch) {
        mapping[csvHeader] = partialMatch.value;
      }
    });
    
    fieldMapping = mapping;
    initialized = true;
    validateMapping();
  }

  function validateMapping() {
    mappingErrors = [];
    
    if (!config || !config.requiredFields) {
      console.log('Config not ready, skipping validation');
      return;
    }
    
    // Check that all required fields are mapped
    config.requiredFields.forEach(requiredField => {
      const isMapped = Object.values(fieldMapping).includes(requiredField);
      if (!isMapped) {
        const fieldLabel = fieldDisplayNames[requiredField] || requiredField;
        mappingErrors.push(`Required field "${fieldLabel}" is not mapped to any CSV column`);
      }
    });
    
    // Check for duplicate mappings
    const mappedFields = Object.values(fieldMapping).filter(field => field);
    const duplicates = mappedFields.filter((field, index) => 
      mappedFields.indexOf(field) !== index
    );
    
    duplicates.forEach(duplicate => {
      const fieldLabel = fieldDisplayNames[duplicate] || duplicate;
      mappingErrors.push(`Field "${fieldLabel}" is mapped to multiple CSV columns`);
    });
  }

  function updateMapping(csvHeader: string, dbField: string) {
    if (dbField === '') {
      delete fieldMapping[csvHeader];
    } else {
      fieldMapping[csvHeader] = dbField;
    }
    fieldMapping = { ...fieldMapping }; // Trigger reactivity
    validateMapping();
  }

  function resetMapping() {
    fieldMapping = {};
    initialized = false;
    validateMapping();
  }

  function autoMap() {
    initialized = false;
    initializeMapping();
  }

  function handleNext() {
    validateMapping();
    if (mappingErrors.length === 0) {
      console.log('ImportFieldMapping handleNext called, dispatching "next" event');
      dispatch('next', fieldMapping);
    }
  }

  function handleBack() {
    dispatch('back');
  }

  // Get sample data for preview
  function getSampleData(csvHeader: string): string[] {
    return parsedData.data
      .slice(0, 3)
      .map(row => row[csvHeader])
      .filter(value => value !== null && value !== undefined && value !== '');
  }

  // Check if a database field is already mapped
  function isFieldMapped(dbField: string): boolean {
    return Object.values(fieldMapping).includes(dbField);
  }

  // Initialize mapping when component loads and config is ready
  $: if (config && config.requiredFields && availableFields.length > 0 && parsedData && parsedData.headers && !initialized) {
    console.log('Config ready, initializing mapping');
    initializeMapping();
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="text-center">
    <h3 class="text-lg font-medium text-gray-900 mb-2">
      Field Mapping
    </h3>
    <p class="text-sm text-gray-600">
      Map your CSV columns to the correct database fields. Required fields must be mapped.
    </p>
  </div>

  <!-- Mapping Controls -->
  <div class="flex justify-between items-center bg-gray-50 rounded-lg p-4">
    <div class="text-sm text-gray-600">
      Map {parsedData.headers.length} CSV columns to database fields
    </div>
    <div class="space-x-2">
      <button
        on:click={autoMap}
        class="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
      >
        Auto-map
      </button>
      <button
        on:click={resetMapping}
        class="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
      >
        Reset
      </button>
    </div>
  </div>

  <!-- Validation Errors -->
  {#if mappingErrors.length > 0}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-red-800">Mapping Issues</h4>
          <ul class="mt-1 text-sm text-red-700 list-disc list-inside">
            {#each mappingErrors as error}
              <li>{error}</li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/if}

  <!-- Field Mapping Table -->
  <div class="border border-gray-200 rounded-lg overflow-hidden">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h4 class="text-sm font-medium text-gray-900">Column Mapping</h4>
    </div>
    
    <div class="divide-y divide-gray-200">
      {#each parsedData.headers as csvHeader}
        {@const sampleData = getSampleData(csvHeader)}
        <div class="p-4">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- CSV Column Info -->
            <div class="space-y-2">
              <div class="font-medium text-gray-900">{csvHeader}</div>
              <div class="text-xs text-gray-500">
                Sample data:
                {#if sampleData.length > 0}
                  <div class="mt-1 space-y-1">
                    {#each sampleData.slice(0, 2) as sample}
                      <div class="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                        {sample}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <span class="italic">No sample data</span>
                {/if}
              </div>
            </div>

            <!-- Mapping Arrow -->
            <div class="flex items-center justify-center lg:justify-start">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </div>

            <!-- Database Field Selection -->
            <div class="space-y-2">
              <select
                bind:value={fieldMapping[csvHeader]}
                on:change={(e) => updateMapping(csvHeader, e.target.value)}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select field...</option>
                {#each availableFields as field}
                  <option 
                    value={field.value}
                    disabled={isFieldMapped(field.value) && fieldMapping[csvHeader] !== field.value}
                    class="{field.required ? 'font-semibold' : ''}"
                  >
                    {field.label}
                    {field.required ? ' (Required)' : ''}
                    {isFieldMapped(field.value) && fieldMapping[csvHeader] !== field.value ? ' (Already mapped)' : ''}
                  </option>
                {/each}
              </select>
              
              {#if fieldMapping[csvHeader]}
                {@const selectedField = availableFields.find(f => f.value === fieldMapping[csvHeader])}
                {#if selectedField && selectedField.description}
                  <div class="text-xs text-gray-500">
                    {selectedField.description}
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Required Fields Summary -->
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h4 class="text-sm font-medium text-blue-800 mb-2">Required Fields Status</h4>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      {#each config.requiredFields as requiredField}
        {@const isMapped = Object.values(fieldMapping).includes(requiredField)}
        {@const fieldLabel = fieldDisplayNames[requiredField] || requiredField}
        <div class="flex items-center text-sm">
          {#if isMapped}
            <svg class="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <span class="text-green-800">{fieldLabel}</span>
          {:else}
            <svg class="h-4 w-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-red-800">{fieldLabel}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>

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
      disabled={mappingErrors.length > 0}
      class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Continue to Options
    </button>
  </div>
</div>
