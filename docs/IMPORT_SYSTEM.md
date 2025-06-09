# Mass Import System Documentation

## Overview

The Civics Lab Svelte application includes a comprehensive, universal mass import system that allows users to import large datasets from CSV files for contacts, businesses, and donations. The system features intelligent field mapping, duplicate detection, batch processing, and robust error handling.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Supported Import Types](#supported-import-types)
- [User Interface](#user-interface)
- [Field Mapping](#field-mapping)
- [Address Handling](#address-handling)
- [Duplicate Prevention](#duplicate-prevention)
- [Import Options](#import-options)
- [Progress Tracking](#progress-tracking)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Configuration](#configuration)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

## Features

### ✅ Core Capabilities
- **Universal Import System** - Single interface for contacts, businesses, and donations
- **CSV File Processing** - Robust parsing with Papa Parse library
- **Intelligent Field Mapping** - Auto-mapping with manual override capabilities
- **Flexible Address Support** - Both structured and combined address formats
- **Duplicate Detection** - Configurable duplicate field detection
- **Batch Processing** - Efficient processing of large datasets
- **Real-time Progress** - Live progress tracking with error reporting
- **Validation** - Comprehensive data validation before import
- **Error Recovery** - Graceful error handling with detailed logging

### ✅ Data Quality Features
- **Type Conversion** - Automatic data type handling and conversion
- **Data Sanitization** - Trimming, null handling, and empty value filtering
- **Duplicate Prevention** - Prevents duplicate emails, phones, addresses for same contact
- **State/ZIP Lookup** - Automatic linking to existing state and ZIP code records
- **Related Entity Lookup** - Gender and race lookups for contacts

## Architecture

### Component Structure
```
src/lib/components/import/
├── ImportModal.svelte           # Main modal orchestrator
├── ImportStepIndicator.svelte   # Progress indicator
├── ImportFileUpload.svelte      # File upload component
├── ImportPreview.svelte         # Data preview and validation
├── ImportFieldMapping.svelte    # Column to field mapping
├── ImportOptions.svelte         # Import configuration
├── ImportProgress.svelte        # Real-time progress tracking
└── ImportResults.svelte         # Results summary and errors
```

### Service Layer
```
src/lib/services/
├── importService.ts             # Core import business logic
├── csvProcessor.ts              # CSV parsing and validation
├── duplicateDetector.ts         # Duplicate detection logic
└── templateService.ts           # CSV template generation
```

### Configuration
```
src/lib/config/
└── importConfigs.ts             # Import type configurations
```

### API Layer
```
src/routes/api/import/
├── +server.ts                   # Main import API endpoint
├── config/+server.ts            # Import configuration endpoint
└── template/+server.ts          # CSV template download
```

## Supported Import Types

### Contacts
**Required Fields:**
- `firstName` - Contact's first name
- `lastName` - Contact's last name

**Optional Fields:**
- `middleName` - Middle name or initial
- `genderId` - Gender (must match existing options)
- `raceId` - Race/ethnicity (must match existing options)
- `pronouns` - Preferred pronouns (e.g., he/him, she/her, they/them)
- `vanid` - VAN (Voter Activation Network) ID
- `emails` - Email addresses (comma-separated)
- `phoneNumbers` - Phone numbers (comma-separated)
- `addresses` - Full addresses (comma-separated)
- `streetAddress` - Primary street address
- `secondaryStreetAddress` - Apartment, suite, unit number
- `city` - City name
- `state` - State name or abbreviation
- `zipCode` - ZIP or postal code
- `socialMediaAccounts` - Social media (format: platform:handle)
- `tags` - Labels or categories (comma-separated)

### Businesses
**Required Fields:**
- `businessName` - Official business name

**Optional Fields:**
- `status` - Business status (active, inactive, closed)
- `phoneNumbers` - Phone numbers (comma-separated)
- `addresses` - Full addresses (comma-separated)
- `streetAddress` - Primary street address
- `secondaryStreetAddress` - Suite, floor, unit number
- `city` - City name
- `state` - State name or abbreviation
- `zipCode` - ZIP or postal code
- `socialMediaAccounts` - Social media accounts
- `employees` - Employee emails (comma-separated)
- `tags` - Categories or labels (comma-separated)

### Donations
**Required Fields:**
- `amount` - Donation amount in dollars (e.g., 100.00)

**Optional Fields:**
- `contactId` - Existing contact ID
- `businessId` - Existing business ID
- `status` - Donation status (promise, donated, processing, cleared)
- `paymentType` - Payment method
- `notes` - Additional notes
- `donorEmail` - Email to find donor contact
- `donorName` - Name to find donor contact
- `businessName` - Business name to find donor business

## User Interface

### Step-by-Step Import Process

#### Step 1: File Upload
- **Purpose:** Select and upload CSV file
- **Features:**
  - Drag & drop or click to upload
  - File validation and preview
  - Automatic CSV parsing
  - Error detection

#### Step 2: Data Preview
- **Purpose:** Review parsed data and validation results
- **Features:**
  - Sample data display (first 5-10 rows)
  - Total row count
  - Validation error summary
  - Data quality indicators

#### Step 3: Field Mapping
- **Purpose:** Map CSV columns to database fields
- **Features:**
  - Auto-mapping with fuzzy matching
  - Manual field selection dropdowns
  - Required field validation
  - Field descriptions and help text
  - Sample data preview for each column
  - Duplicate mapping detection

#### Step 4: Import Options
- **Purpose:** Configure import settings
- **Features:**
  - Import mode selection (Create Only vs Update or Create)
  - Duplicate detection field selection
  - Batch size configuration
  - Validation-only option
  - Import summary and time estimates

#### Step 5: Progress Tracking
- **Purpose:** Monitor import progress in real-time
- **Features:**
  - Progress bar and percentage
  - Batch-by-batch status
  - Success/failure counters
  - Real-time error reporting
  - Cancel option

#### Step 6: Results Summary
- **Purpose:** Review import results and handle errors
- **Features:**
  - Success/failure statistics
  - Error categorization
  - Detailed error reporting
  - Error log download
  - Restart options

## Field Mapping

### Auto-Mapping Algorithm
The system uses intelligent auto-mapping to suggest field mappings:

1. **Exact Matches:** Direct column name to field name matching
2. **Fuzzy Matching:** Normalized text comparison (case-insensitive, special chars removed)
3. **Partial Matching:** Substring matching for common variations
4. **Manual Override:** Users can change any auto-mapped field

### Mapping Validation
- **Required Field Check:** Ensures all required fields are mapped
- **Duplicate Check:** Prevents mapping multiple columns to same field
- **Field Description:** Helpful tooltips for each database field

## Address Handling

The system supports both structured and combined address formats:

### Structured Address Fields
```csv
streetAddress,secondaryStreetAddress,city,state,zipCode
123 Main St,Apt 4B,Anytown,Wisconsin,12345
```

### Combined Address Field
```csv
addresses
"123 Main St, Apt 4B, Anytown, Wisconsin, 12345"
```

### Features
- **State Lookup:** Automatic matching by name or abbreviation
- **ZIP Code Linking:** Links to existing ZIP code records
- **Flexible Input:** Handles both structured and unstructured formats
- **Duplicate Prevention:** Prevents duplicate addresses for same contact/business

## Duplicate Prevention

### Update Mode Deduplication
When using "Update or Create" mode, the system prevents duplicate related data:

#### Email Addresses
- Checks: `contactId + email` (case-insensitive)
- Prevents: Multiple identical emails for same contact

#### Phone Numbers
- Checks: `contactId + phoneNumber` (exact match)
- Prevents: Multiple identical phone numbers for same contact

#### Addresses
- Checks: `contactId + streetAddress + city` (case-insensitive)
- Prevents: Multiple identical addresses for same contact

#### Social Media Accounts
- Checks: `contactId + platform + handle` (case-insensitive)
- Prevents: Multiple identical social media accounts for same contact

#### Tags
- Checks: `contactId + tag` (case-insensitive)
- Prevents: Multiple identical tags for same contact

### Duplicate Detection Fields
Primary duplicate detection options by import type:

**Contacts:**
- `emails` - Match by email address
- `phoneNumbers` - Match by phone number
- `vanid` - Match by VAN ID

**Businesses:**
- `businessName` - Match by business name
- `phoneNumbers` - Match by phone number

**Donations:**
- `contactId` - Match by contact
- `businessId` - Match by business
- `amount` - Match by amount

## Import Options

### Import Modes

#### Create Only
- **Behavior:** Only creates new records
- **Duplicates:** Skips rows that match existing records
- **Use Case:** Adding new data without modifying existing records

#### Update or Create
- **Behavior:** Updates existing records or creates new ones
- **Duplicates:** Updates matching records, creates non-matching ones
- **Use Case:** Syncing data or updating existing records

### Batch Processing
- **Batch Sizes:** 50, 100 (recommended), 200, 500 rows per batch
- **Benefits:** Memory efficiency, error isolation, progress tracking
- **Considerations:** Smaller batches = more reliable, larger batches = faster

### Validation Options
- **Skip Empty Rows:** Automatically skip rows with all empty mapped fields
- **Validation Only:** Run validation without importing data

## Progress Tracking

### Real-Time Updates
- **Progress Bar:** Visual percentage complete
- **Batch Status:** Current batch number and total batches
- **Counters:** Processed, successful, failed record counts
- **Error Feed:** Recent errors displayed in real-time

### Performance Monitoring
- **Estimated Time:** Based on batch size and total records
- **Processing Speed:** Tracks rows per second
- **Memory Usage:** Efficient batch processing prevents memory issues

## Error Handling

### Error Types

#### Validation Errors
- Missing required fields
- Invalid data formats (email, phone, etc.)
- Enum value mismatches
- Data type conversion failures

#### Duplicate Errors
- Duplicate records found during processing
- Constraint violations

#### Processing Errors
- Database connection issues
- Foreign key constraint failures
- Unexpected data structure issues

### Error Reporting
- **Row-Level Errors:** Specific row number and error message
- **Error Categorization:** Grouped by error type
- **Raw Data Logging:** Original data saved for debugging
- **Error Export:** Download detailed error report as CSV

### Error Recovery
- **Graceful Degradation:** Processing continues after errors
- **Partial Success:** Successfully imports valid rows
- **Retry Mechanism:** Option to fix and retry failed imports

## API Endpoints

### Main Import API: `/api/import`

#### Actions

##### Create Session
```typescript
POST /api/import
{
  action: 'create_session',
  workspaceId: string,
  importType: 'contacts' | 'businesses' | 'donations',
  filename: string,
  totalRecords: number,
  importMode: 'create_only' | 'update_or_create',
  duplicateField: string,
  fieldMapping: Record<string, string>
}
```

##### Process Batch
```typescript
POST /api/import
{
  action: 'process_batch',
  sessionId: string,
  batchData: any[],
  startIndex: number,
  batchNumber: number,
  totalBatches: number
}
```

##### Get Progress
```typescript
POST /api/import
{
  action: 'get_progress',
  sessionId: string
}
```

### Configuration API: `/api/import/config`
Returns import configurations for field mapping and validation.

### Template API: `/api/import/template`
Generates and downloads CSV templates for each import type.

## Database Schema

### Import Sessions Table
```sql
CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  import_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  import_mode VARCHAR(50) NOT NULL,
  duplicate_field VARCHAR(100),
  field_mapping JSONB NOT NULL,
  error_log JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Import Errors Table
```sql
CREATE TABLE import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_session_id UUID REFERENCES import_sessions(id),
  row_number INTEGER NOT NULL,
  field_name VARCHAR(100),
  error_type VARCHAR(50),
  error_message TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

### Import Configurations (`src/lib/config/importConfigs.ts`)

#### IMPORT_CONFIGS
Defines the structure for each import type:
```typescript
{
  type: string,
  displayName: string,
  description: string,
  requiredFields: string[],
  optionalFields: string[],
  validationRules: Record<string, ValidationRule>,
  duplicateDetectionFields: string[],
  relatedEntities: Record<string, RelatedEntityConfig>
}
```

#### FIELD_DISPLAY_NAMES
User-friendly names for database fields.

#### FIELD_DESCRIPTIONS
Helpful descriptions for field mapping tooltips.

#### VALIDATION_PATTERNS
Regular expressions for data validation.

#### ENUM_DEFAULTS
Default values for enum fields.

## Development Guide

### Adding New Import Types

1. **Update Configuration**
   ```typescript
   // Add to IMPORT_CONFIGS in importConfigs.ts
   newType: {
     type: 'newType',
     displayName: 'New Type',
     requiredFields: ['field1'],
     optionalFields: ['field2'],
     // ... other config
   }
   ```

2. **Add Field Mappings**
   ```typescript
   // Add to FIELD_DISPLAY_NAMES and FIELD_DESCRIPTIONS
   newType: {
     field1: 'Field 1 Display Name',
     field2: 'Field 2 Display Name'
   }
   ```

3. **Implement Creation Logic**
   ```typescript
   // Add case to ImportService.createRecord()
   case 'newType':
     await this.createNewType(data, workspaceId);
     break;
   ```

4. **Add Update Logic**
   ```typescript
   // Add case to ImportService.updateRecord()
   case 'newType':
     await this.updateNewType(recordId, data, workspaceId);
     break;
   ```

### Extending Field Types

1. **Add Validation Rule**
   ```typescript
   // Add to ValidationRule type
   type: 'required' | 'email' | 'phone' | 'newType'
   ```

2. **Implement Validation**
   ```typescript
   // Add case to CSVProcessor.validateField()
   case 'newType':
     return this.validateNewType(value, rule);
   ```

### Customizing UI Components

All import components are modular and can be customized:
- Import styling via Tailwind classes
- Modify step flow in `ImportModal.svelte`
- Add custom validation in `ImportPreview.svelte`
- Extend field mapping in `ImportFieldMapping.svelte`

## Troubleshooting

### Common Issues

#### Import Fails at Batch Processing
**Symptoms:** 500 error during batch processing
**Causes:** 
- Invalid field mappings
- Missing required fields
- Database constraint violations
- Large batch sizes

**Solutions:**
1. Check browser console for detailed error logs
2. Verify all required fields are mapped
3. Reduce batch size
4. Validate data format matches expected types

#### Field Auto-Mapping Not Working
**Symptoms:** No fields auto-mapped during field mapping step
**Causes:**
- Column names don't match expected patterns
- Configuration not loaded properly

**Solutions:**
1. Check import configuration is loaded
2. Manually map fields
3. Use standardized column names in CSV

#### Duplicate Detection Not Working
**Symptoms:** Duplicate records created despite duplicate detection
**Causes:**
- Wrong duplicate field selected
- Data formatting issues (spaces, case differences)

**Solutions:**
1. Choose appropriate duplicate detection field
2. Clean data formatting before import
3. Use case-insensitive matching

#### Performance Issues with Large Files
**Symptoms:** Import takes very long or times out
**Causes:**
- Large file size
- Large batch sizes
- Complex data validation

**Solutions:**
1. Split large files into smaller chunks
2. Reduce batch size to 50 rows
3. Use "Create Only" mode for better performance
4. Process during off-peak hours

### Debug Mode

Enable detailed logging by setting environment variables:
```bash
NODE_ENV=development
DEBUG_IMPORT=true
```

This provides:
- Detailed console logging
- Processing timestamps
- Memory usage tracking
- SQL query logging

### Error Recovery

If an import fails partially:
1. **Download Error Report:** Get detailed error CSV
2. **Fix Data Issues:** Correct problematic rows
3. **Re-import:** Import only the corrected data
4. **Use Update Mode:** Avoid re-creating successful records

## Performance Considerations

### Optimization Tips

1. **Batch Size:** Use 100 rows for optimal balance
2. **Data Cleaning:** Clean data before import to reduce validation overhead
3. **Index Usage:** Ensure proper database indexes on lookup fields
4. **Memory Management:** Process large files in chunks
5. **Connection Pooling:** Use database connection pooling for concurrent imports

### Scalability

The system is designed to handle:
- **File Size:** Up to 10MB CSV files (approximately 50,000 rows)
- **Concurrent Users:** Multiple users can import simultaneously
- **Large Datasets:** Batch processing prevents memory issues
- **Error Recovery:** Graceful handling of partial failures

## Security Considerations

### Data Protection
- **Workspace Isolation:** All imports scoped to user's workspace
- **User Authentication:** Requires valid authentication
- **Input Validation:** Comprehensive validation prevents injection attacks
- **Error Logging:** Sensitive data not logged in error messages

### File Upload Security
- **File Type Validation:** Only CSV files accepted
- **File Size Limits:** Configurable upload size limits
- **Content Scanning:** Validates CSV structure before processing

## Future Enhancements

### Planned Features
- **Excel Support:** Direct .xlsx file import
- **Advanced Address Parsing:** Better address normalization
- **Custom Field Mapping:** Save and reuse field mappings
- **Scheduled Imports:** Automated recurring imports
- **Data Transformation:** Built-in data cleaning and transformation
- **Import Templates:** Pre-configured import settings
- **Bulk Operations:** Mass update/delete operations
- **Integration APIs:** Direct API imports from external systems

### Performance Improvements
- **Streaming Processing:** Handle larger files with streaming
- **Parallel Processing:** Multi-threaded batch processing
- **Caching:** Cache validation results and lookups
- **Background Jobs:** Move imports to background queue system

---

## Support

For technical support or questions about the import system:

1. **Check this documentation** for common issues and solutions
2. **Review error logs** in browser console and server logs
3. **Test with small datasets** to isolate issues
4. **Verify configurations** match your data structure

The import system is designed to be robust and user-friendly, handling the complexities of data import while providing clear feedback and error reporting throughout the process.
