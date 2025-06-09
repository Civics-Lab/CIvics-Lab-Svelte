import type { 
  ParsedCSVData, 
  ImportConfig, 
  ValidationRule, 
  ImportValidationResult 
} from '$lib/types/import';
import { VALIDATION_PATTERNS } from '$lib/config/importConfigs';
import { browser } from '$app/environment';

export class CSVProcessor {
  /**
   * Load Papa Parse library from CDN
   */
  private static async loadPapaparse(): Promise<any> {
    if (!browser) {
      throw new Error('CSV processing is only available in the browser');
    }
    
    // Check if Papa is already loaded
    if ((window as any).Papa) {
      return (window as any).Papa;
    }
    
    // Load Papa Parse from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/papaparse@5.5.3/papaparse.min.js';
      script.onload = () => {
        if ((window as any).Papa) {
          resolve((window as any).Papa);
        } else {
          reject(new Error('Papa Parse failed to load properly'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load Papa Parse from CDN'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Parse a CSV file using Papa Parse library
   */
  static async parseFile(file: File): Promise<ParsedCSVData> {
    return new Promise(async (resolve, reject) => {
      try {
        const PapaParser = await this.loadPapaparse();
        
        PapaParser.parse(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          transformHeader: (header: string) => header.trim(), // Clean headers
          complete: (results) => {
            resolve({
              headers: results.meta.fields || [],
              data: results.data,
              errors: results.errors,
              totalRows: results.data.length
            });
          },
          error: (error) => reject(error)
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Validate CSV data against import configuration
   */
  static validateData(
    data: any[], 
    config: ImportConfig,
    fieldMapping: Record<string, string>
  ): ImportValidationResult {
    const validRows: any[] = [];
    const invalidRows: Array<{ row: any; rowNumber: number; errors: string[] }> = [];

    data.forEach((row, index) => {
      const errors: string[] = [];
      const mappedRow = this.mapRowData(row, fieldMapping);

      // Validate required fields
      config.requiredFields.forEach(field => {
        const value = mappedRow[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`${field} is required`);
        }
      });

      // Apply validation rules
      Object.entries(config.validationRules).forEach(([field, rule]) => {
        const value = mappedRow[field];
        if (value) {
          const error = this.validateField(value, rule);
          if (error) errors.push(`${field}: ${error}`);
        }
      });

      // Validate special field formats
      this.validateSpecialFields(mappedRow, errors);

      if (errors.length > 0) {
        invalidRows.push({ row, rowNumber: index + 1, errors });
      } else {
        validRows.push(mappedRow);
      }
    });

    return { 
      validRows, 
      invalidRows, 
      duplicates: [] // Will be populated by duplicate detection service
    };
  }

  /**
   * Map CSV row data to database fields using field mapping
   */
  private static mapRowData(
    row: any, 
    fieldMapping: Record<string, string>
  ): any {
    const mappedData: any = {};

    Object.entries(fieldMapping).forEach(([csvColumn, dbField]) => {
      if (row[csvColumn] !== undefined && dbField) {
        mappedData[dbField] = row[csvColumn];
      }
    });

    return mappedData;
  }

  /**
   * Validate individual field based on validation rule
   */
  private static validateField(value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'email':
        return this.validateEmail(value) ? null : rule.message;
      
      case 'phone':
        return this.validatePhone(value) ? null : rule.message;
      
      case 'number':
        return this.validateNumber(value, rule) ? null : rule.message;
      
      case 'enum':
        return rule.options?.includes(value) ? null : rule.message;
      
      default:
        return null;
    }
  }

  /**
   * Validate email format
   */
  private static validateEmail(value: string): boolean {
    if (typeof value !== 'string') return false;
    
    // Handle multiple emails (comma-separated)
    const emails = value.split(',').map(email => email.trim());
    return emails.every(email => VALIDATION_PATTERNS.email.test(email));
  }

  /**
   * Validate phone number format
   */
  private static validatePhone(value: string): boolean {
    if (typeof value !== 'string') return false;
    
    // Handle multiple phone numbers (comma-separated)
    const phones = value.split(',').map(phone => phone.trim());
    return phones.every(phone => VALIDATION_PATTERNS.phone.test(phone));
  }

  /**
   * Validate number field
   */
  private static validateNumber(value: any, rule: ValidationRule): boolean {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (rule.min !== undefined && num < rule.min) return false;
    if (rule.max !== undefined && num > rule.max) return false;
    return true;
  }

  /**
   * Validate special field formats (social media, addresses, etc.)
   */
  private static validateSpecialFields(row: any, errors: string[]): void {
    // Validate social media format
    if (row.socialMediaAccounts) {
      const socialMedia = row.socialMediaAccounts.split(',').map((sm: string) => sm.trim());
      socialMedia.forEach((sm: string) => {
        if (!VALIDATION_PATTERNS.socialMedia.test(sm)) {
          errors.push(`Social media account "${sm}" must be in format "platform:handle"`);
        }
      });
    }

    // Validate amount format for donations
    if (row.amount !== undefined) {
      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount < 0) {
        errors.push('Amount must be a positive number');
      }
    }
  }

  /**
   * Clean and normalize data for import
   */
  static cleanData(data: any[]): any[] {
    return data.map(row => {
      const cleanedRow: any = {};
      
      Object.entries(row).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Trim strings
          if (typeof value === 'string') {
            cleanedRow[key] = value.trim();
          } else {
            cleanedRow[key] = value;
          }
        }
      });
      
      return cleanedRow;
    });
  }

  /**
   * Generate CSV template for download
   */
  static generateTemplate(config: ImportConfig): string {
    const headers = [...config.requiredFields, ...config.optionalFields];
    const sampleData = this.generateSampleData(config.type);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      headers.map(header => sampleData[header] || '').join(',')
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Generate sample data for CSV template
   */
  private static generateSampleData(importType: string): Record<string, string> {
    switch (importType) {
      case 'contacts':
        return {
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'M',
          emails: 'john.doe@example.com',
          phoneNumbers: '+1-555-123-4567',
          addresses: '123 Main St, City, State, 12345',
          pronouns: 'he/him',
          vanid: 'VAN123456',
          tags: 'volunteer,donor'
        };
      case 'businesses':
        return {
          businessName: 'Acme Corporation',
          phoneNumbers: '+1-555-987-6543',
          addresses: '456 Business Ave, City, State, 67890',
          tags: 'retail,local',
          status: 'active'
        };
      case 'donations':
        return {
          amount: '100.00',
          status: 'promise',
          paymentType: 'check',
          donorEmail: 'donor@example.com',
          notes: 'Monthly donation'
        };
      default:
        return {};
    }
  }

  /**
   * Detect CSV delimiter
   */
  static detectDelimiter(csvText: string): string {
    const delimiters = [',', ';', '\t', '|'];
    const sample = csvText.split('\n').slice(0, 5).join('\n');
    
    let maxCount = 0;
    let bestDelimiter = ',';
    
    delimiters.forEach(delimiter => {
      const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    });
    
    return bestDelimiter;
  }
}
