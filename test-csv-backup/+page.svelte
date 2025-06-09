<!-- Simple CSV test page -->
<script lang="ts">
  import { CSVProcessor } from '$lib/services/csvProcessor';
  
  let testResult = '';
  let isLoading = false;
  let fileInput: HTMLInputElement;

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    isLoading = true;
    testResult = '';
    
    try {
      console.log('Starting CSV processing...');
      const result = await CSVProcessor.parseFile(file);
      testResult = `✅ Success! Parsed ${result.totalRows} rows with headers: ${result.headers.join(', ')}`;
      console.log('CSV Parse Result:', result);
      
    } catch (error) {
      testResult = `❌ Error: ${error.message}`;
      console.error('CSV Parse Error:', error);
    } finally {
      isLoading = false;
    }
  }

  function createTestCSV() {
    const csvContent = 'firstName,lastName,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>CSV Test</title>
</svelte:head>

<div class="container mx-auto p-8 max-w-2xl">
  <h1 class="text-3xl font-bold mb-8">CSV Import Test</h1>
  
  <div class="space-y-6">
    <!-- Test CSV Download -->
    <div class="bg-blue-50 p-4 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">1. Download Test CSV</h2>
      <p class="text-gray-600 mb-4">Download a sample CSV file to test with:</p>
      <button 
        on:click={createTestCSV}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Download Test CSV
      </button>
    </div>

    <!-- File Upload Test -->
    <div class="bg-gray-50 p-4 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">2. Upload CSV File</h2>
      <p class="text-gray-600 mb-4">Select a CSV file to test the parser:</p>
      
      <input 
        bind:this={fileInput}
        type="file" 
        accept=".csv"
        on:change={handleFileUpload}
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </div>

    <!-- Loading State -->
    {#if isLoading}
      <div class="bg-yellow-50 p-4 rounded-lg">
        <div class="flex items-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
          <span class="text-yellow-800">Processing CSV file...</span>
        </div>
      </div>
    {/if}

    <!-- Results -->
    {#if testResult}
      <div class="p-4 rounded-lg {testResult.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}">
        <h3 class="font-semibold mb-2">Result:</h3>
        <p class="whitespace-pre-wrap">{testResult}</p>
      </div>
    {/if}

    <!-- Usage Instructions -->
    <div class="bg-gray-100 p-4 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">How to test:</h2>
      <ol class="list-decimal list-inside space-y-1 text-gray-700">
        <li>Click "Download Test CSV" to get a sample file</li>
        <li>Upload the downloaded CSV file using the file input</li>
        <li>Check the console and results for any errors</li>
      </ol>
    </div>
  </div>
</div>
