import type { CSVTemplate, ImportConfig } from '$lib/types/import';
import { IMPORT_CONFIGS, FIELD_DISPLAY_NAMES } from '$lib/config/importConfigs';

export class TemplateService {
  /**
   * Generate CSV template for download
   */
  static generateCSVTemplate(importType: string): CSVTemplate {
    const config = IMPORT_CONFIGS[importType];
    if (!config) {
      throw new Error(`Invalid import type: ${importType}`);
    }

    const headers = [...config.requiredFields, ...config.optionalFields];
    const sampleData = this.generateSampleData(importType);
    const displayNames = FIELD_DISPLAY_NAMES[importType] || {};

    return {
      headers,
      sampleData,
      filename: `${importType}_template.csv`,
      description: `Template for importing ${config.displayName.toLowerCase()}`
    };
  }

  /**
   * Convert template to CSV content string
   */
  static templateToCSV(template: CSVTemplate): string {
    const csvContent = [
      template.headers.join(','),
      template.headers.map(header => template.sampleData[header] || '').join(',')
    ].join('\n');
    
    return csvContent;
  }

  /**
   * Generate downloadable CSV file
   */
  static downloadTemplate(importType: string): void {
    const template = this.generateCSVTemplate(importType);
    const csvContent = this.templateToCSV(template);
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', template.filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Generate sample data for each import type
   */
  private static generateSampleData(importType: string): Record<string, string> {
    switch (importType) {
      case 'contacts':
        return {
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'M',
          genderId: 'Male',
          raceId: 'White',
          pronouns: 'he/him',
          vanid: 'VAN123456',
          emails: 'john.doe@example.com,j.doe@work.com',
          phoneNumbers: '+1-555-123-4567,+1-555-987-6543',
          addresses: '123 Main St, Anytown, State, 12345',
          streetAddress: '123 Main St',
          secondaryStreetAddress: 'Apt 4B',
          city: 'Anytown',
          state: 'Wisconsin',
          zipCode: '12345',
          socialMediaAccounts: 'facebook:johndoe,twitter:@johndoe',
          tags: 'volunteer,donor,active'
        };
      
      case 'businesses':
        return {
          businessName: 'Acme Corporation',
          status: 'active',
          phoneNumbers: '+1-555-987-6543,+1-555-111-2222',
          addresses: '456 Business Ave, Business City, State, 67890',
          streetAddress: '456 Business Ave',
          secondaryStreetAddress: 'Suite 200',
          city: 'Business City',
          state: 'Wisconsin',
          zipCode: '67890',
          socialMediaAccounts: 'facebook:acmecorp,twitter:@acmecorp',
          employees: 'employee1@example.com,employee2@example.com',
          tags: 'retail,local,sponsor'
        };
      
      case 'donations':
        return {
          amount: '100.00',
          contactId: '', // Leave empty for template
          businessId: '', // Leave empty for template
          status: 'promise',
          paymentType: 'check',
          notes: 'Monthly donation pledge',
          donorEmail: 'donor@example.com',
          donorName: 'John Doe',
          businessName: 'Acme Corporation'
        };
      
      default:
        return {};
    }
  }

  /**
   * Get field descriptions for template documentation
   */
  static getFieldDescriptions(importType: string): Record<string, string> {
    const config = IMPORT_CONFIGS[importType];
    if (!config) return {};

    const descriptions: Record<string, string> = {};

    // Add descriptions for required fields
    config.requiredFields.forEach(field => {
      descriptions[field] = this.getFieldDescription(importType, field);
    });

    // Add descriptions for optional fields
    config.optionalFields.forEach(field => {
      descriptions[field] = this.getFieldDescription(importType, field);
    });

    return descriptions;
  }

  /**
   * Get description for a specific field
   */
  private static getFieldDescription(importType: string, field: string): string {
    const fieldDescriptions: Record<string, Record<string, string>> = {
      contacts: {
        firstName: 'Required. The contact\'s first name.',
        lastName: 'Required. The contact\'s last name.',
        middleName: 'Optional. Middle name or initial.',
        genderId: 'Optional. Gender (must match existing options: Male, Female, Other, etc.)',
        raceId: 'Optional. Race/ethnicity (must match existing options)',
        pronouns: 'Optional. Preferred pronouns (e.g., he/him, she/her, they/them)',
        vanid: 'Optional. Voter Activation Network ID number',
        emails: 'Optional. Email addresses separated by commas',
        phoneNumbers: 'Optional. Phone numbers separated by commas',
        addresses: 'Optional. Full addresses separated by commas (alternative to individual fields)',
        streetAddress: 'Optional. Primary street address (e.g., 123 Main St)',
        secondaryStreetAddress: 'Optional. Apartment, suite, or unit number',
        city: 'Optional. City name',
        state: 'Optional. State name or abbreviation (e.g., Wisconsin or WI)',
        zipCode: 'Optional. ZIP or postal code',
        socialMediaAccounts: 'Optional. Format: platform:handle (e.g., facebook:johndoe)',
        tags: 'Optional. Labels or categories separated by commas'
      },
      businesses: {
        businessName: 'Required. Official business or organization name.',
        status: 'Optional. Status: active, inactive, or closed (default: active)',
        phoneNumbers: 'Optional. Business phone numbers separated by commas',
        addresses: 'Optional. Business addresses separated by commas (alternative to individual fields)',
        streetAddress: 'Optional. Primary business street address',
        secondaryStreetAddress: 'Optional. Suite, floor, or unit number',
        city: 'Optional. City where business is located',
        state: 'Optional. State where business is located (name or abbreviation)',
        zipCode: 'Optional. Business ZIP or postal code',
        socialMediaAccounts: 'Optional. Format: platform:handle (e.g., facebook:business)',
        employees: 'Optional. Employee email addresses separated by commas',
        tags: 'Optional. Business categories or labels separated by commas'
      },
      donations: {
        amount: 'Required. Donation amount in dollars (e.g., 100.00)',
        contactId: 'Optional. Existing contact ID (leave empty to search by email/name)',
        businessId: 'Optional. Existing business ID (leave empty to search by name)',
        status: 'Optional. Status: promise, donated, processing, cleared (default: promise)',
        paymentType: 'Optional. Payment method (e.g., cash, check, credit card)',
        notes: 'Optional. Additional notes about the donation',
        donorEmail: 'Optional. Email to find existing contact donor',
        donorName: 'Optional. Full name to find existing contact donor',
        businessName: 'Optional. Business name to find existing business donor'
      }
    };

    return fieldDescriptions[importType]?.[field] || 'No description available';
  }

  /**
   * Generate template with instructions
   */
  static generateTemplateWithInstructions(importType: string): string {
    const template = this.generateCSVTemplate(importType);
    const descriptions = this.getFieldDescriptions(importType);
    const config = IMPORT_CONFIGS[importType];

    let content = `# ${config.displayName} Import Template\n`;
    content += `# ${config.description}\n`;
    content += `#\n`;
    content += `# Instructions:\n`;
    content += `# 1. Fill in your data below the sample row\n`;
    content += `# 2. Required fields: ${config.requiredFields.join(', ')}\n`;
    content += `# 3. Delete this instruction section before importing\n`;
    content += `# 4. Keep the header row intact\n`;
    content += `#\n`;
    content += `# Field Descriptions:\n`;
    
    template.headers.forEach(header => {
      const isRequired = config.requiredFields.includes(header);
      const description = descriptions[header] || 'No description';
      content += `# ${header} (${isRequired ? 'Required' : 'Optional'}): ${description}\n`;
    });
    
    content += `#\n`;
    content += `# Sample Data (replace with your actual data):\n`;
    content += template.headers.join(',') + '\n';
    content += template.headers.map(header => template.sampleData[header] || '').join(',') + '\n';

    return content;
  }

  /**
   * Validate template format
   */
  static validateTemplate(csvData: any[], importType: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const config = IMPORT_CONFIGS[importType];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!csvData || csvData.length === 0) {
      errors.push('CSV file is empty');
      return { isValid: false, errors, warnings };
    }

    const headers = Object.keys(csvData[0]);
    const requiredFields = config.requiredFields;

    // Check for required fields
    requiredFields.forEach(field => {
      if (!headers.includes(field)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Check for unknown fields
    headers.forEach(header => {
      const allValidFields = [...config.requiredFields, ...config.optionalFields];
      if (!allValidFields.includes(header)) {
        warnings.push(`Unknown field: ${header} (will be ignored)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get available import types with metadata
   */
  static getAvailableImportTypes(): Array<{
    type: string;
    displayName: string;
    description: string;
    requiredFields: string[];
    optionalFields: string[];
  }> {
    return Object.values(IMPORT_CONFIGS).map(config => ({
      type: config.type,
      displayName: config.displayName,
      description: config.description,
      requiredFields: config.requiredFields,
      optionalFields: config.optionalFields
    }));
  }
}
