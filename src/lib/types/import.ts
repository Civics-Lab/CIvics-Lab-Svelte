// Import system type definitions
export interface ImportConfig {
  type: 'contacts' | 'businesses' | 'donations';
  requiredFields: string[];
  optionalFields: string[];
  validationRules: Record<string, ValidationRule>;
  duplicateDetectionFields: string[];
  relatedEntities?: Record<string, RelatedEntityConfig>;
  displayName: string;
  description: string;
}

export interface ImportSession {
  id: string;
  workspaceId: string;
  importType: 'contacts' | 'businesses' | 'donations';
  filename: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  importMode: 'create_only' | 'update_or_create';
  duplicateField?: string;
  fieldMapping: Record<string, string>;
  errorLog?: any[];
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

export interface ImportError {
  id: string;
  importSessionId: string;
  rowNumber: number;
  fieldName?: string;
  errorType: 'validation' | 'duplicate' | 'processing';
  errorMessage: string;
  rawData?: any;
  createdAt: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'number' | 'date' | 'enum';
  message: string;
  options?: string[]; // For enum validation
  min?: number; // For number/length validation
  max?: number;
}

export interface RelatedEntityConfig {
  table: string;
  searchFields: string[];
  createIfNotFound: boolean;
  defaultValues?: Record<string, any>;
}

export interface ParsedCSVData {
  headers: string[];
  data: any[];
  errors: any[];
  totalRows: number;
}

export interface ImportFieldMapping {
  [csvColumn: string]: string; // Maps CSV column to database field
}

export interface ImportOptions {
  mode: 'create_only' | 'update_or_create';
  duplicateField: string;
  batchSize: number;
  skipEmptyRows: boolean;
  validateOnly?: boolean;
}

export interface ImportValidationResult {
  validRows: any[];
  invalidRows: Array<{
    row: any;
    rowNumber: number;
    errors: string[];
  }>;
  duplicates: Array<{
    row: any;
    rowNumber: number;
    duplicates: any[];
  }>;
}

export interface ImportProgress {
  sessionId: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentBatch?: number;
  totalBatches?: number;
  errors?: ImportError[];
}

export interface ImportResults {
  sessionId: string;
  filename: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: 'completed' | 'failed';
  errors: ImportError[];
  duration?: number;
  summary?: {
    created: number;
    updated: number;
    skipped: number;
  };
}

export interface BatchProcessResult {
  successful: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    error: string;
    data: any;
  }>;
}

// Field mapping interfaces for each entity type
export interface ContactFieldMapping {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  genderId?: string;
  raceId?: string;
  pronouns?: string;
  vanid?: string;
  emails?: string;
  phoneNumbers?: string;
  addresses?: string;
  socialMediaAccounts?: string;
  tags?: string;
}

export interface BusinessFieldMapping {
  businessName?: string;
  status?: string;
  phoneNumbers?: string;
  addresses?: string;
  socialMediaAccounts?: string;
  employees?: string;
  tags?: string;
}

export interface DonationFieldMapping {
  amount?: string;
  contactId?: string;
  businessId?: string;
  status?: string;
  paymentType?: string;
  notes?: string;
  donorEmail?: string; // For looking up contacts
  donorName?: string; // For looking up contacts
  businessName?: string; // For looking up businesses
}

// CSV template interfaces
export interface CSVTemplate {
  headers: string[];
  sampleData: Record<string, string>;
  filename: string;
  description: string;
}

// Import step interface for UI
export interface ImportStep {
  number: number;
  title: string;
  description: string;
  completed?: boolean;
  active?: boolean;
}
