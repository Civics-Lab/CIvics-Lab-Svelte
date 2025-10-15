/**
 * ActBlue CSV Import Service (Client-side)
 * Manages CSV export requests, status checking, and import operations
 */

import type { ActBlueImport, ActBlueCsvType, CsvStatusResponse } from '$lib/types/actblue';

/**
 * Get all CSV imports for a workspace
 */
export async function fetchCsvImports(
  workspaceId: string
): Promise<ActBlueImport[]> {
  const response = await fetch(`/api/actblue/csv?workspace_id=${workspaceId}`);

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch CSV imports');
    } catch (jsonError) {
      throw new Error(`Failed to fetch CSV imports: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data.imports;
}

/**
 * Get specific CSV import by ID
 */
export async function fetchCsvImport(
  importId: string,
  workspaceId: string
): Promise<ActBlueImport> {
  const response = await fetch(`/api/actblue/csv/${importId}?workspace_id=${workspaceId}`);

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch CSV import');
    } catch (jsonError) {
      throw new Error(`Failed to fetch CSV import: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data.import;
}

/**
 * Request a CSV export from ActBlue
 */
export async function requestCsvExport(
  workspaceId: string,
  csvType: ActBlueCsvType,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<{ csvId: string; importId: string; message: string }> {
  const response = await fetch(`/api/actblue/csv/request?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      csvType,
      dateRangeStart,
      dateRangeEnd
    })
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request CSV export');
    } catch (jsonError) {
      throw new Error(`Failed to request CSV export: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return {
    csvId: data.csvId,
    importId: data.importId,
    message: data.message
  };
}

/**
 * Check status of a CSV export from ActBlue
 */
export async function checkCsvStatus(
  csvId: string,
  workspaceId: string
): Promise<CsvStatusResponse> {
  const response = await fetch(`/api/actblue/csv/status/${csvId}?workspace_id=${workspaceId}`);

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check CSV status');
    } catch (jsonError) {
      throw new Error(`Failed to check CSV status: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data.status;
}

/**
 * Import CSV data from ActBlue (after requesting and checking status)
 */
export async function importCsv(
  csvId: string,
  csvType: ActBlueCsvType,
  workspaceId: string
): Promise<{ importId: string; totalRecords: number; message: string }> {
  const response = await fetch(`/api/actblue/csv/import?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      csvId,
      csvType
    })
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to import CSV');
    } catch (jsonError) {
      throw new Error(`Failed to import CSV: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return {
    importId: data.importId,
    totalRecords: data.totalRecords,
    message: data.message
  };
}

/**
 * Upload and import CSV data directly
 */
export async function uploadCsv(
  csvContent: string,
  csvType: ActBlueCsvType,
  workspaceId: string,
  filename?: string
): Promise<{ importId: string; totalRecords: number; message: string }> {
  const response = await fetch(`/api/actblue/csv/upload?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      csvContent,
      csvType,
      filename
    })
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload CSV');
    } catch (jsonError) {
      throw new Error(`Failed to upload CSV: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return {
    importId: data.importId,
    totalRecords: data.totalRecords,
    message: data.message
  };
}

/**
 * Poll CSV status until complete
 * Returns a promise that resolves when the CSV is ready
 */
export async function pollCsvStatus(
  csvId: string,
  workspaceId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<CsvStatusResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await checkCsvStatus(csvId, workspaceId);

    if (status.status === 'complete') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error('CSV export failed');
    }

    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('CSV export timed out');
}

/**
 * Full workflow: Request, wait, and import CSV
 */
export async function requestAndImportCsv(
  workspaceId: string,
  csvType: ActBlueCsvType,
  dateRangeStart: string,
  dateRangeEnd: string,
  onProgress?: (status: 'requesting' | 'waiting' | 'importing' | 'complete') => void
): Promise<{ importId: string; totalRecords: number }> {
  // Step 1: Request CSV
  onProgress?.('requesting');
  const { csvId } = await requestCsvExport(workspaceId, csvType, dateRangeStart, dateRangeEnd);

  // Step 2: Wait for CSV to be ready
  onProgress?.('waiting');
  const status = await pollCsvStatus(csvId, workspaceId);

  // Step 3: Import CSV
  onProgress?.('importing');
  const result = await importCsv(csvId, csvType, workspaceId);

  // Step 4: Complete
  onProgress?.('complete');
  return {
    importId: result.importId,
    totalRecords: result.totalRecords
  };
}

/**
 * Utility: Format CSV type for display
 */
export function formatCsvType(csvType: ActBlueCsvType): string {
  const typeMap: Record<ActBlueCsvType, string> = {
    paid_contributions: 'Paid Contributions',
    refunded_contributions: 'Refunded Contributions',
    cancelled_recurring_contributions: 'Cancelled Recurring Contributions',
    managed_form_contributions: 'Managed Form Contributions'
  };

  return typeMap[csvType] || csvType;
}

/**
 * Utility: Format import status for display
 */
export function formatImportStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  };

  return statusMap[status] || status;
}

/**
 * Utility: Get status badge color
 */
export function getImportStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'gray',
    processing: 'blue',
    completed: 'green',
    failed: 'red'
  };

  return colorMap[status] || 'gray';
}

/**
 * Utility: Calculate import progress percentage
 */
export function calculateImportProgress(importRecord: ActBlueImport): number {
  if (importRecord.totalRecords === 0) {
    return 0;
  }

  return Math.round((importRecord.processedRecords / importRecord.totalRecords) * 100);
}
