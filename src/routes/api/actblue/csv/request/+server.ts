import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { actblueCsvService } from '../service';
import { verifyWorkspaceAccess } from '$lib/utils/auth';

// POST /api/actblue/csv/request?workspace_id=[workspace_id] - Request CSV export from ActBlue
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
    const { csvType, dateRangeStart, dateRangeEnd } = await request.json();

    // Validate required fields
    if (!csvType) {
      throw error(400, 'csvType is required');
    }

    if (!dateRangeStart || !dateRangeEnd) {
      throw error(400, 'dateRangeStart and dateRangeEnd are required');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateRangeStart) || !dateRegex.test(dateRangeEnd)) {
      throw error(400, 'Dates must be in YYYY-MM-DD format');
    }

    // Request CSV from ActBlue
    const response = await actblueCsvService.requestCsvExport(
      workspaceId,
      csvType,
      dateRangeStart,
      dateRangeEnd
    );

    // Create import record
    const importRecord = await actblueCsvService.createImport(
      workspaceId,
      user.id,
      {
        csvType,
        dateRangeStart,
        dateRangeEnd,
        totalRecords: 0 // Will be updated when processed
      }
    );

    return json({
      csvId: response.id,
      importId: importRecord.id,
      message: 'CSV export requested. Use the /status endpoint to check progress.'
    });
  } catch (err) {
    console.error('Error requesting CSV export:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error && (err.message.includes('required') || err.message.includes('Invalid') || err.message.includes('not configured') || err.message.includes('not enabled'))) {
      throw error(400, err.message);
    }

    throw error(500, 'Failed to request CSV export');
  }
};
