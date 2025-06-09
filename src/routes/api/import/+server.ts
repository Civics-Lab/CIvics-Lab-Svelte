import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ImportService } from '$lib/services/importService';
import { DuplicateDetector } from '$lib/services/duplicateDetector';
import { CSVProcessor } from '$lib/services/csvProcessor';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const requestData = await request.json();
    const { action, ...data } = requestData;
    
    // Verify authentication
    if (!locals.user) {
      throw error(401, 'Authentication required');
    }

    // Verify workspace access for most actions
    if (data.workspaceId) {
      await verifyWorkspaceAccess(locals.user, data.workspaceId);
    }

    switch (action) {
      case 'create_session':
        return await handleCreateSession(data, locals.user.id);
      
      case 'process_batch':
        return await handleProcessBatch(data);
      
      case 'get_progress':
        return await handleGetProgress(data);
      
      case 'get_session':
        return await handleGetSession(data);
      
      case 'cancel_session':
        return await handleCancelSession(data);
      
      case 'delete_session':
        return await handleDeleteSession(data);
      
      case 'validate_data':
        return await handleValidateData(data);
      
      case 'check_duplicates':
        return await handleCheckDuplicates(data);
      
      default:
        throw error(400, `Invalid action: ${action}`);
    }
  } catch (err) {
    console.error('Import API error:', err);
    
    if (err instanceof Response) {
      throw err;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Import operation failed: ${errorMessage}`);
  }
};

/**
 * Create a new import session
 */
async function handleCreateSession(data: any, userId: string) {
  const {
    workspaceId,
    importType,
    filename,
    totalRecords,
    importMode,
    duplicateField,
    fieldMapping
  } = data;

  // Validate required fields
  if (!workspaceId || !importType || !filename || !totalRecords || !importMode || !fieldMapping) {
    throw error(400, 'Missing required fields for import session');
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

  return json({ sessionId });
}

/**
 * Process a batch of import data
 */
async function handleProcessBatch(data: any) {
  const { sessionId, batchData, startIndex } = data;

  if (!sessionId || !batchData || startIndex === undefined) {
    throw error(400, 'Missing required fields for batch processing');
  }

  console.log(`Processing batch for session ${sessionId}:`, {
    startIndex,
    batchSize: batchData.length,
    sampleData: batchData[0]
  });

  try {
    const result = await ImportService.processImportBatch(
      sessionId,
      batchData,
      startIndex
    );

    console.log(`Batch processing completed:`, result);
    return json(result);
  } catch (batchError) {
    console.error('Batch processing error:', batchError);
    console.error('Error details:', {
      sessionId,
      startIndex,
      batchSize: batchData.length,
      errorMessage: batchError.message,
      errorStack: batchError.stack
    });
    throw batchError;
  }
}

/**
 * Get import progress for a session
 */
async function handleGetProgress(data: any) {
  const { sessionId } = data;

  if (!sessionId) {
    throw error(400, 'Session ID is required');
  }

  const progress = await ImportService.getImportProgress(sessionId);
  
  if (!progress) {
    throw error(404, 'Import session not found');
  }

  return json({ progress });
}

/**
 * Get import session details
 */
async function handleGetSession(data: any) {
  const { sessionId } = data;

  if (!sessionId) {
    throw error(400, 'Session ID is required');
  }

  const session = await ImportService.getImportSession(sessionId);
  
  if (!session) {
    throw error(404, 'Import session not found');
  }

  return json({ session });
}

/**
 * Cancel an import session
 */
async function handleCancelSession(data: any) {
  const { sessionId } = data;

  if (!sessionId) {
    throw error(400, 'Session ID is required');
  }

  await ImportService.cancelImportSession(sessionId);

  return json({ success: true });
}

/**
 * Delete an import session
 */
async function handleDeleteSession(data: any) {
  const { sessionId } = data;

  if (!sessionId) {
    throw error(400, 'Session ID is required');
  }

  await ImportService.deleteImportSession(sessionId);

  return json({ success: true });
}

/**
 * Validate CSV data without importing
 */
async function handleValidateData(data: any) {
  const { csvData, importType, fieldMapping } = data;

  if (!csvData || !importType || !fieldMapping) {
    throw error(400, 'Missing required fields for validation');
  }

  // Import the config dynamically to avoid SSR issues
  const { IMPORT_CONFIGS } = await import('$lib/config/importConfigs');
  const config = IMPORT_CONFIGS[importType];
  
  if (!config) {
    throw error(400, `Invalid import type: ${importType}`);
  }

  const validationResult = CSVProcessor.validateData(csvData, config, fieldMapping);

  return json({ validationResult });
}

/**
 * Check for duplicates in the data
 */
async function handleCheckDuplicates(data: any) {
  const { csvData, importType, workspaceId, duplicateField } = data;

  if (!csvData || !importType || !workspaceId || !duplicateField) {
    throw error(400, 'Missing required fields for duplicate checking');
  }

  const duplicates = await DuplicateDetector.findDuplicates(
    importType,
    csvData,
    workspaceId,
    duplicateField
  );

  return json({ duplicates });
}
