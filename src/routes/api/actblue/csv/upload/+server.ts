import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueCsvService } from '../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// POST /api/actblue/csv/upload?workspace_id=[workspace_id] - Upload and import CSV manually
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
    const { csvContent, csvType, filename } = await request.json();

    if (!csvContent || !csvType) {
      throw error(400, 'csvContent and csvType are required');
    }

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
        filename: filename || 'manual_upload.csv',
        totalRecords: csvRows.length
      }
    );

    // Process import (runs asynchronously)
    actblueCsvService
      .processCsvImport(importRecord.id, workspaceId, user.id, csvRows)
      .catch(err => {
        console.error('Error processing CSV upload:', err);
      });

    return json({
      importId: importRecord.id,
      totalRecords: csvRows.length,
      message: 'CSV upload started. Check import status for progress.'
    });
  } catch (err) {
    console.error('Error uploading CSV:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && (err.message.includes('required') || err.message.includes('No valid data'))) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to upload CSV');
  }
};
