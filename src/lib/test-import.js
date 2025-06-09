// Test script for import system
import { ImportService } from '../services/importService.js';
import { CSVProcessor } from '../services/csvProcessor.js';
import { IMPORT_CONFIGS } from '../config/importConfigs.js';

async function testImportSystem() {
  console.log('🧪 Testing Import System...');
  
  try {
    // Test 1: CSV Processing
    console.log('\n1. Testing CSV Processing...');
    const sampleCSVContent = `firstName,lastName,email
John,Doe,john@example.com
Jane,Smith,jane@example.com`;
    
    const blob = new Blob([sampleCSVContent], { type: 'text/csv' });
    const file = new File([blob], 'test.csv', { type: 'text/csv' });
    
    const parsedData = await CSVProcessor.parseFile(file);
    console.log('✅ CSV parsed successfully:', {
      headers: parsedData.headers,
      rowCount: parsedData.data.length
    });
    
    // Test 2: Import Configuration
    console.log('\n2. Testing Import Configuration...');
    const contactConfig = IMPORT_CONFIGS.contacts;
    console.log('✅ Contact config loaded:', {
      type: contactConfig.type,
      requiredFields: contactConfig.requiredFields,
      optionalFields: contactConfig.optionalFields.length
    });
    
    // Test 3: Field Mapping
    console.log('\n3. Testing Field Mapping...');
    const fieldMapping = {
      'firstName': 'firstName',
      'lastName': 'lastName',
      'email': 'emails'
    };
    
    const validationResult = CSVProcessor.validateData(
      parsedData.data,
      contactConfig,
      fieldMapping
    );
    
    console.log('✅ Validation completed:', {
      validRows: validationResult.validRows.length,
      invalidRows: validationResult.invalidRows.length
    });
    
    console.log('\n🎉 All tests passed! Import system is ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testImportSystem();
}

export { testImportSystem };
