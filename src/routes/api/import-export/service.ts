import { ImportService } from '$lib/services/importService';
import { DuplicateDetector } from '$lib/services/duplicateDetector';
import { CSVProcessor } from '$lib/services/csvProcessor';
import { TemplateService } from '$lib/services/templateService';
import { verifyWorkspaceAccess } from '$lib/server/auth';

export const importExportService = {
  // Import session management
  async createSession(data: any, userId: string) {
    const {
      workspaceId,
      importType,
      filename,
      totalRecords,
      importMode,
      duplicateField,
      fieldMapping
    } = data;

    if (!workspaceId || !importType || !filename || !totalRecords || !importMode || !fieldMapping) {
      throw new Error('Missing required fields for import session');
    }

    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    const sessionId = await ImportService.createImportSession(
      workspaceId,
      importType,
      filename,
      totalRecords,
      importMode,
      duplicateField || '',
      fieldMapping,
      userId
    );

    return { sessionId };
  },

  async processBatch(data: any) {
    const { sessionId, batchData, startIndex, validateOnly } = data;

    if (!sessionId || !batchData || startIndex === undefined) {
      throw new Error('Missing required fields for batch processing');
    }

    const result = await ImportService.processImportBatch(
      sessionId,
      batchData,
      startIndex,
      validateOnly || false
    );

    return result;
  },

  async getProgress(sessionId: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const progress = await ImportService.getImportProgress(sessionId);
    
    if (!progress) {
      throw new Error('Import session not found');
    }

    return { progress };
  },

  async getSession(sessionId: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    const session = await ImportService.getImportSession(sessionId);
    
    if (!session) {
      throw new Error('Import session not found');
    }

    return { session };
  },

  async cancelSession(sessionId: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    await ImportService.cancelImportSession(sessionId);
    return { success: true };
  },

  async deleteSession(sessionId: string) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    await ImportService.deleteImportSession(sessionId);
    return { success: true };
  },

  async validateData(data: any) {
    const { csvData, importType, fieldMapping } = data;

    if (!csvData || !importType || !fieldMapping) {
      throw new Error('Missing required fields for validation');
    }

    const { IMPORT_CONFIGS } = await import('$lib/config/importConfigs');
    const config = IMPORT_CONFIGS[importType];
    
    if (!config) {
      throw new Error(`Invalid import type: ${importType}`);
    }

    const validationResult = CSVProcessor.validateData(csvData, config, fieldMapping);
    return { validationResult };
  },

  async checkDuplicates(data: any) {
    const { csvData, importType, workspaceId, duplicateField } = data;

    if (!csvData || !importType || !workspaceId || !duplicateField) {
      throw new Error('Missing required fields for duplicate checking');
    }

    const duplicates = await DuplicateDetector.findDuplicates(
      importType,
      csvData,
      workspaceId,
      duplicateField
    );

    return { duplicates };
  },

  // Template generation
  async getImportConfig(importType?: string) {
    const { IMPORT_CONFIGS, FIELD_DISPLAY_NAMES, FIELD_DESCRIPTIONS } = await import('$lib/config/importConfigs');

    if (importType) {
      if (!['contacts', 'businesses', 'donations'].includes(importType)) {
        throw new Error('Invalid import type');
      }

      const config = IMPORT_CONFIGS[importType];
      const fieldDisplayNames = FIELD_DISPLAY_NAMES[importType] || {};
      const fieldDescriptions = FIELD_DESCRIPTIONS[importType] || {};

      return {
        config,
        fieldDisplayNames,
        fieldDescriptions
      };
    } else {
      const availableTypes = Object.keys(IMPORT_CONFIGS).map(type => ({
        type,
        displayName: IMPORT_CONFIGS[type].displayName,
        description: IMPORT_CONFIGS[type].description,
        requiredFields: IMPORT_CONFIGS[type].requiredFields,
        optionalFields: IMPORT_CONFIGS[type].optionalFields,
        duplicateDetectionFields: IMPORT_CONFIGS[type].duplicateDetectionFields
      }));

      return {
        availableTypes,
        fieldDisplayNames: FIELD_DISPLAY_NAMES,
        fieldDescriptions: FIELD_DESCRIPTIONS
      };
    }
  },

  async generateTemplate(importType: string, includeInstructions: boolean = false) {
    if (!['contacts', 'businesses', 'donations'].includes(importType)) {
      throw new Error('Invalid import type');
    }

    let csvContent: string;
    let filename: string;

    if (includeInstructions) {
      csvContent = TemplateService.generateTemplateWithInstructions(importType);
      filename = `${importType}_template_with_instructions.csv`;
    } else {
      const template = TemplateService.generateCSVTemplate(importType);
      csvContent = TemplateService.templateToCSV(template);
      filename = template.filename;
    }

    return {
      content: csvContent,
      filename,
      mimeType: 'text/csv'
    };
  }
};