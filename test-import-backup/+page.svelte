<!-- Test component to verify CSV import functionality -->
<script lang="ts">
  import { CSVProcessor } from '$lib/services/csvProcessor';
  
  let testResult = '';
  let isLoading = false;

  async function testCSVImport() {
    isLoading = true;
    testResult = '';
    
    try {
      // Create a simple test CSV file
      const csvContent = 'firstName,lastName,email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      
      // Test the parser
      const result = await CSVProcessor.parseFile(file);
      testResult = `Success! Parsed ${result.totalRows} rows with headers: ${result.headers.join(', ')}`;
      console.log('CSV Parse Result:', result);
      
    } catch (error) {
      testResult = `Error: ${error.message}`;
      console.error('CSV Parse Error:', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto mt-8">
  <h2 class="text-xl font-semibold mb-4">CSV Import Test</h2>
  
  <button 
    on:click={testCSVImport}
    disabled={isLoading}
    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
  >
    {isLoading ? 'Testing...' : 'Test CSV Import'}
  </button>
  
  {#if testResult}
    <div class="mt-4 p-3 rounded {testResult.startsWith('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
      {testResult}
    </div>
  {/if}
</div>
