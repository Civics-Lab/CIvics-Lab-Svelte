import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Verify authentication
    if (!locals.user) {
      throw error(401, 'Authentication required');
    }

    const importType = url.searchParams.get('type');

    // Import configs dynamically to avoid SSR issues
    const { IMPORT_CONFIGS, FIELD_DISPLAY_NAMES, FIELD_DESCRIPTIONS } = await import('$lib/config/importConfigs');

    if (importType) {
      // Return specific import type configuration
      if (!['contacts', 'businesses', 'donations'].includes(importType)) {
        throw error(400, 'Invalid import type');
      }

      const config = IMPORT_CONFIGS[importType];
      const fieldDisplayNames = FIELD_DISPLAY_NAMES[importType] || {};
      const fieldDescriptions = FIELD_DESCRIPTIONS[importType] || {};

      return json({
        config,
        fieldDisplayNames,
        fieldDescriptions
      });
    } else {
      // Return all available import configurations
      const availableTypes = Object.keys(IMPORT_CONFIGS).map(type => ({
        type,
        displayName: IMPORT_CONFIGS[type].displayName,
        description: IMPORT_CONFIGS[type].description,
        requiredFields: IMPORT_CONFIGS[type].requiredFields,
        optionalFields: IMPORT_CONFIGS[type].optionalFields,
        duplicateDetectionFields: IMPORT_CONFIGS[type].duplicateDetectionFields
      }));

      return json({
        availableTypes,
        fieldDisplayNames: FIELD_DISPLAY_NAMES,
        fieldDescriptions: FIELD_DESCRIPTIONS
      });
    }

  } catch (err) {
    console.error('Import config API error:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Failed to get import configuration: ${errorMessage}`);
  }
};
