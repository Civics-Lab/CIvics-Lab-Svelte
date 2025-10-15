import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueCsvService } from '../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// POST /api/actblue/csv/import?workspace_id=[workspace_id] - Download and import CSV
export const POST: RequestHandler = async ({ request, url, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const workspaceId = url.searchParams.get('workspace_id');

  if (!workspaceId) {
    throw error(400, 'workspace_id is required');
  }

  await verifyWorkspaceAccess(user, workspaceId);

  try {
    const { csvId, csvType } = await request.json();

    if (!csvId || !csvType) {
      throw error(400, 'csvId and csvType are required');
    }

    // Check CSV status
    const status = await actblueCsvService.checkCsvStatus(workspaceId, csvId);

    if (status.status !== 'complete') {
      throw error(400, `CSV is not ready yet. Current status: ${status.status}`);
    }

    if (!status.downloadUrl) {
      throw error(400, 'Download URL not available');
    }

    // Download CSV
    const csvContent = await actblueCsvService.downloadCsv(workspaceId, status.downloadUrl);

    // Parse CSV
    const csvRows = actblueCsvService.parseCsvData(csvContent, csvType);

    if (csvRows.length === 0) {
      throw error(400, 'No valid data found in CSV');
    }

    // Create import record
    const importRecord = await actblueCsvService.createImport(
      workspaceId,
      user.id,
      {
        csvType,
        totalRecords: csvRows.length
      }
    );

    // Process import (runs asynchronously)
    actblueCsvService
      .processCsvImport(importRecord.id, workspaceId, user.id, csvRows)
      .catch(err => {
        console.error('Error processing CSV import:', err);
      });

    return json({
      importId: importRecord.id,
      totalRecords: csvRows.length,
      message: 'CSV import started. Check import status for progress.'
    });
  } catch (err) {
    console.error('Error importing CSV:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && (err.message.includes('required') || err.message.includes('not ready') || err.message.includes('not available') || err.message.includes('not configured'))) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to import CSV');
  }
};
