/**
 * ActBlue CSV Import API Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { actblueCsvService } from './service';
import { verifyJWT } from '$lib/utils/jwt';

// Zod schemas for validation
const requestCsvSchema = z.object({
  csvType: z.enum(['paid_contributions', 'refunded_contributions', 'cancelled_recurring_contributions', 'managed_form_contributions']),
  dateRangeStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  dateRangeEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});

const importCsvSchema = z.object({
  csvId: z.string().min(1, 'CSV ID is required'),
  csvType: z.enum(['paid_contributions', 'refunded_contributions', 'cancelled_recurring_contributions', 'managed_form_contributions'])
});

const uploadCsvSchema = z.object({
  csvContent: z.string().min(1, 'CSV content is required'),
  csvType: z.enum(['paid_contributions', 'refunded_contributions', 'cancelled_recurring_contributions', 'managed_form_contributions']),
  filename: z.string().optional()
});

export const actblueCsvRouter = new Hono()
  /**
   * GET /api/actblue/csv?workspace_id=<id>
   * Get all CSV imports for a workspace
   */
  .get('/', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const imports = await actblueCsvService.getImports(workspaceId);

      return c.json({ imports, success: true });
    } catch (err) {
      console.error('Error fetching CSV imports:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to fetch CSV imports',
          success: false
        },
        500
      );
    }
  })

  /**
   * GET /api/actblue/csv/:id?workspace_id=<id>
   * Get specific CSV import by ID
   */
  .get('/:id', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const { id } = c.req.param();

      const importRecord = await actblueCsvService.getImport(id, workspaceId);

      if (!importRecord) {
        return c.json({ error: 'Import not found' }, 404);
      }

      return c.json({ import: importRecord, success: true });
    } catch (err) {
      console.error('Error fetching CSV import:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to fetch CSV import',
          success: false
        },
        500
      );
    }
  })

  /**
   * POST /api/actblue/csv/request?workspace_id=<id>
   * Request a CSV export from ActBlue
   */
  .post('/request', zValidator('json', requestCsvSchema), async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const { csvType, dateRangeStart, dateRangeEnd } = c.req.valid('json');

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
        payload.userId as string,
        {
          csvType,
          dateRangeStart,
          dateRangeEnd,
          totalRecords: 0 // Will be updated when processed
        }
      );

      return c.json({
        csvId: response.id,
        importId: importRecord.id,
        success: true,
        message: 'CSV export requested. Use the /status endpoint to check progress.'
      });
    } catch (err) {
      console.error('Error requesting CSV export:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to request CSV export',
          success: false
        },
        500
      );
    }
  })

  /**
   * GET /api/actblue/csv/status/:csvId?workspace_id=<id>
   * Check status of a CSV export from ActBlue
   */
  .get('/status/:csvId', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const { csvId } = c.req.param();

      const status = await actblueCsvService.checkCsvStatus(workspaceId, csvId);

      return c.json({ status, success: true });
    } catch (err) {
      console.error('Error checking CSV status:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to check CSV status',
          success: false
        },
        500
      );
    }
  })

  /**
   * POST /api/actblue/csv/import?workspace_id=<id>
   * Download CSV from ActBlue and import the data
   */
  .post('/import', zValidator('json', importCsvSchema), async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const { csvId, csvType } = c.req.valid('json');

      // Check CSV status
      const status = await actblueCsvService.checkCsvStatus(workspaceId, csvId);

      if (status.status !== 'complete') {
        return c.json(
          {
            error: 'CSV is not ready yet',
            status: status.status,
            success: false
          },
          400
        );
      }

      if (!status.downloadUrl) {
        return c.json(
          {
            error: 'Download URL not available',
            success: false
          },
          400
        );
      }

      // Download CSV
      const csvContent = await actblueCsvService.downloadCsv(workspaceId, status.downloadUrl);

      // Parse CSV
      const csvRows = actblueCsvService.parseCsvData(csvContent, csvType);

      // Create import record
      const importRecord = await actblueCsvService.createImport(
        workspaceId,
        payload.userId as string,
        {
          csvType,
          totalRecords: csvRows.length
        }
      );

      // Process import (runs asynchronously)
      actblueCsvService
        .processCsvImport(importRecord.id, workspaceId, payload.userId as string, csvRows)
        .catch(err => {
          console.error('Error processing CSV import:', err);
        });

      return c.json({
        importId: importRecord.id,
        totalRecords: csvRows.length,
        success: true,
        message: 'CSV import started. Check import status for progress.'
      });
    } catch (err) {
      console.error('Error importing CSV:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to import CSV',
          success: false
        },
        500
      );
    }
  })

  /**
   * POST /api/actblue/csv/upload?workspace_id=<id>
   * Upload and import CSV data directly (for manual uploads)
   */
  .post('/upload', zValidator('json', uploadCsvSchema), async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const { csvContent, csvType, filename } = c.req.valid('json');

      // Parse CSV
      const csvRows = actblueCsvService.parseCsvData(csvContent, csvType);

      if (csvRows.length === 0) {
        return c.json(
          {
            error: 'No valid data found in CSV',
            success: false
          },
          400
        );
      }

      // Create import record
      const importRecord = await actblueCsvService.createImport(
        workspaceId,
        payload.userId as string,
        {
          csvType,
          filename: filename || 'manual_upload.csv',
          totalRecords: csvRows.length
        }
      );

      // Process import (runs asynchronously)
      actblueCsvService
        .processCsvImport(importRecord.id, workspaceId, payload.userId as string, csvRows)
        .catch(err => {
          console.error('Error processing CSV upload:', err);
        });

      return c.json({
        importId: importRecord.id,
        totalRecords: csvRows.length,
        success: true,
        message: 'CSV upload started. Check import status for progress.'
      });
    } catch (err) {
      console.error('Error uploading CSV:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to upload CSV',
          success: false
        },
        500
      );
    }
  });
