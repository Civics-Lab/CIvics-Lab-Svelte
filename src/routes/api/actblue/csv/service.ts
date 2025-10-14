/**
 * ActBlue CSV Import Service
 * Handles CSV export requests, status polling, and bulk import processing
 */

import { db } from '$lib/server/db';
import { actblueImports, actblueConfig, donations, subscriptions, contacts } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type {
  ActBlueImport,
  ActBlueCsvType,
  RequestCsvData,
  CsvRequestResponse,
  CsvStatusResponse
} from '$lib/types/actblue';
import { findMatchingContact, createContactFromActBlue } from '$lib/services/actblue/contactMatchingService';

interface CsvDonationRow {
  // Donor info
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  addr1: string;
  city: string;
  state: string;
  zip: string;
  country: string;

  // Contribution info
  orderNumber: string;
  lineitemId: string;
  amount: string;
  recurringAmount?: string;
  recurringPeriod?: string;
  recurringDuration?: string;
  sequence?: string;
  createdAt: string;
  paidAt?: string;

  // Entity info
  committeeName: string;
  entityId: string;

  // Form info
  formName: string;

  // Additional fields
  refcode?: string;
  refcode2?: string;
}

export class ActBlueCsvService {
  /**
   * Create a new import record
   */
  async createImport(
    workspaceId: string,
    userId: string,
    importData: {
      csvType: ActBlueCsvType;
      filename?: string;
      dateRangeStart?: string;
      dateRangeEnd?: string;
      totalRecords: number;
    }
  ): Promise<ActBlueImport> {
    const { v4: uuidv4 } = await import('uuid');
    const importId = uuidv4();

    const result = await db
      .insert(actblueImports)
      .values({
        id: importId,
        workspaceId,
        importType: 'csv',
        filename: importData.filename || null,
        csvType: importData.csvType,
        dateRangeStart: importData.dateRangeStart ? new Date(importData.dateRangeStart) : null,
        dateRangeEnd: importData.dateRangeEnd ? new Date(importData.dateRangeEnd) : null,
        totalRecords: importData.totalRecords,
        processedRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        status: 'pending',
        errorLog: {},
        createdAt: new Date(),
        createdById: userId
      })
      .returning();

    return {
      id: result[0].id,
      workspaceId: result[0].workspaceId,
      importType: result[0].importType as 'webhook' | 'csv',
      filename: result[0].filename || undefined,
      csvType: result[0].csvType as ActBlueCsvType | undefined,
      dateRangeStart: result[0].dateRangeStart?.toISOString(),
      dateRangeEnd: result[0].dateRangeEnd?.toISOString(),
      totalRecords: result[0].totalRecords,
      processedRecords: result[0].processedRecords,
      successfulRecords: result[0].successfulRecords,
      failedRecords: result[0].failedRecords,
      status: result[0].status as 'pending' | 'processing' | 'completed' | 'failed',
      errorLog: result[0].errorLog as Record<string, any> | undefined,
      createdAt: result[0].createdAt.toISOString(),
      completedAt: result[0].completedAt?.toISOString(),
      createdById: result[0].createdById || undefined
    };
  }

  /**
   * Update import status
   */
  async updateImportStatus(
    importId: string,
    updates: {
      status?: 'pending' | 'processing' | 'completed' | 'failed';
      processedRecords?: number;
      successfulRecords?: number;
      failedRecords?: number;
      errorLog?: Record<string, any>;
      completedAt?: Date;
    }
  ): Promise<void> {
    await db
      .update(actblueImports)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(actblueImports.id, importId));
  }

  /**
   * Get import by ID
   */
  async getImport(importId: string, workspaceId: string): Promise<ActBlueImport | null> {
    const result = await db
      .select()
      .from(actblueImports)
      .where(
        and(
          eq(actblueImports.id, importId),
          eq(actblueImports.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      importType: row.importType as 'webhook' | 'csv',
      filename: row.filename || undefined,
      csvType: row.csvType as ActBlueCsvType | undefined,
      dateRangeStart: row.dateRangeStart?.toISOString(),
      dateRangeEnd: row.dateRangeEnd?.toISOString(),
      totalRecords: row.totalRecords,
      processedRecords: row.processedRecords,
      successfulRecords: row.successfulRecords,
      failedRecords: row.failedRecords,
      status: row.status as 'pending' | 'processing' | 'completed' | 'failed',
      errorLog: row.errorLog as Record<string, any> | undefined,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      createdById: row.createdById || undefined
    };
  }

  /**
   * Get all imports for a workspace
   */
  async getImports(workspaceId: string): Promise<ActBlueImport[]> {
    const result = await db
      .select()
      .from(actblueImports)
      .where(eq(actblueImports.workspaceId, workspaceId))
      .orderBy(actblueImports.createdAt);

    return result.map(row => ({
      id: row.id,
      workspaceId: row.workspaceId,
      importType: row.importType as 'webhook' | 'csv',
      filename: row.filename || undefined,
      csvType: row.csvType as ActBlueCsvType | undefined,
      dateRangeStart: row.dateRangeStart?.toISOString(),
      dateRangeEnd: row.dateRangeEnd?.toISOString(),
      totalRecords: row.totalRecords,
      processedRecords: row.processedRecords,
      successfulRecords: row.successfulRecords,
      failedRecords: row.failedRecords,
      status: row.status as 'pending' | 'processing' | 'completed' | 'failed',
      errorLog: row.errorLog as Record<string, any> | undefined,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      createdById: row.createdById || undefined
    }));
  }

  /**
   * Request CSV export from ActBlue API
   */
  async requestCsvExport(
    workspaceId: string,
    csvType: ActBlueCsvType,
    dateRangeStart: string,
    dateRangeEnd: string
  ): Promise<CsvRequestResponse> {
    // Get ActBlue config
    const config = await db
      .select()
      .from(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId))
      .limit(1);

    if (config.length === 0 || !config[0].apiKey) {
      throw new Error('ActBlue API key not configured for this workspace');
    }

    if (!config[0].isCsvImportEnabled) {
      throw new Error('CSV import is not enabled for this workspace');
    }

    // Call ActBlue CSV API
    const response = await fetch('https://api.actblue.com/csvs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config[0].apiKey}`
      },
      body: JSON.stringify({
        csv_type: csvType,
        date_range_start: dateRangeStart,
        date_range_end: dateRangeEnd
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ActBlue API error: ${error}`);
    }

    const data = await response.json();
    return { id: data.id };
  }

  /**
   * Check CSV export status
   */
  async checkCsvStatus(
    workspaceId: string,
    csvId: string
  ): Promise<CsvStatusResponse> {
    // Get ActBlue config
    const config = await db
      .select()
      .from(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId))
      .limit(1);

    if (config.length === 0 || !config[0].apiKey) {
      throw new Error('ActBlue API key not configured for this workspace');
    }

    // Call ActBlue CSV status API
    const response = await fetch(`https://api.actblue.com/csvs/${csvId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config[0].apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ActBlue API error: ${error}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      status: data.status,
      downloadUrl: data.download_url
    };
  }

  /**
   * Download CSV from ActBlue
   */
  async downloadCsv(workspaceId: string, downloadUrl: string): Promise<string> {
    // Get ActBlue config
    const config = await db
      .select()
      .from(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId))
      .limit(1);

    if (config.length === 0 || !config[0].apiKey) {
      throw new Error('ActBlue API key not configured for this workspace');
    }

    // Download CSV
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config[0].apiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ActBlue download error: ${error}`);
    }

    return await response.text();
  }

  /**
   * Parse CSV data into donation rows
   */
  parseCsvData(csvContent: string, csvType: ActBlueCsvType): CsvDonationRow[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      return [];
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Parse rows
    const rows: CsvDonationRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

      // Create row object from CSV columns
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Map CSV columns to our format
      rows.push({
        firstname: row.firstname || row.first_name || '',
        lastname: row.lastname || row.last_name || '',
        email: row.email || undefined,
        phone: row.phone || undefined,
        addr1: row.addr1 || row.address || '',
        city: row.city || '',
        state: row.state || '',
        zip: row.zip || row.postal_code || '',
        country: row.country || 'US',
        orderNumber: row.order_number || row.orderNumber || '',
        lineitemId: row.lineitem_id || row.lineitemId || '',
        amount: row.amount || '0',
        recurringAmount: row.recurring_amount || row.recurringAmount,
        recurringPeriod: row.recurring_period || row.recurringPeriod,
        recurringDuration: row.recurring_duration || row.recurringDuration,
        sequence: row.sequence,
        createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        paidAt: row.paid_at || row.paidAt,
        committeeName: row.committee_name || row.committeeName || '',
        entityId: row.entity_id || row.entityId || '',
        formName: row.form_name || row.formName || '',
        refcode: row.refcode,
        refcode2: row.refcode2
      });
    }

    return rows;
  }

  /**
   * Process CSV donations and import them
   */
  async processCsvImport(
    importId: string,
    workspaceId: string,
    userId: string,
    csvRows: CsvDonationRow[]
  ): Promise<{ successful: number; failed: number; errors: any[] }> {
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    // Update status to processing
    await this.updateImportStatus(importId, { status: 'processing' });

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];

      try {
        // Check if donation already exists (idempotency)
        const existingDonation = await db
          .select()
          .from(donations)
          .where(eq(donations.actblueLineitemId, row.lineitemId))
          .limit(1);

        if (existingDonation.length > 0) {
          successful++;
          continue; // Skip duplicate
        }

        // Match or create contact
        const matchResult = await findMatchingContact(
          {
            firstname: row.firstname,
            lastname: row.lastname,
            email: row.email || '',
            phone: row.phone,
            addr1: row.addr1,
            city: row.city,
            state: row.state,
            zip: row.zip,
            country: row.country,
            isEligibleForExpressLane: false
          },
          workspaceId
        );

        let contactId: string;
        if (matchResult.matched && matchResult.contactId) {
          contactId = matchResult.contactId;
        } else {
          contactId = await createContactFromActBlue(
            {
              firstname: row.firstname,
              lastname: row.lastname,
              email: row.email || '',
              phone: row.phone,
              addr1: row.addr1,
              city: row.city,
              state: row.state,
              zip: row.zip,
              country: row.country,
              isEligibleForExpressLane: false
            },
            workspaceId,
            userId
          );
        }

        // Check if this is a recurring donation
        const isRecurring = row.recurringPeriod && row.recurringPeriod !== 'once';
        let subscriptionId: string | null = null;

        if (isRecurring && row.sequence === '0') {
          // Create subscription for first donation in series
          const { v4: uuidv4 } = await import('uuid');
          subscriptionId = uuidv4();

          const recurringAmount = row.recurringAmount
            ? Math.round(parseFloat(row.recurringAmount) * 100)
            : Math.round(parseFloat(row.amount) * 100);

          await db.insert(subscriptions).values({
            id: subscriptionId,
            workspaceId,
            contactId,
            status: 'active',
            startDate: new Date(row.createdAt),
            nextBillingDate: null,
            billingPeriod: row.recurringPeriod as any,
            amount: recurringAmount,
            actblueOrderNumber: row.orderNumber,
            recurringDuration: row.recurringDuration ? parseInt(row.recurringDuration) : null,
            recurringCompleted: 1,
            metadata: {
              importedFromCsv: true,
              formName: row.formName,
              refcode: row.refcode
            },
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else if (isRecurring) {
          // Find existing subscription
          const existingSub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.actblueOrderNumber, row.orderNumber))
            .limit(1);

          if (existingSub.length > 0) {
            subscriptionId = existingSub[0].id;

            // Update recurrence count
            await db
              .update(subscriptions)
              .set({
                recurringCompleted: (existingSub[0].recurringCompleted || 0) + 1,
                updatedAt: new Date()
              })
              .where(eq(subscriptions.id, subscriptionId));
          }
        }

        // Create donation record
        const { v4: uuidv4 } = await import('uuid');
        const donationAmount = Math.round(parseFloat(row.amount) * 100);

        await db.insert(donations).values({
          id: uuidv4(),
          contactId,
          amount: donationAmount,
          status: 'donated',
          paymentType: 'card',
          notes: `Imported from ActBlue CSV - ${row.formName}`,
          subscriptionId,
          isRecurring: !!isRecurring,
          recurringPeriod: row.recurringPeriod || 'once',
          recurrenceNumber: row.sequence ? parseInt(row.sequence) : undefined,
          actblueOrderNumber: row.orderNumber,
          actblueLineitemId: row.lineitemId,
          actblueData: row,
          externalSource: 'actblue',
          disbursedAt: row.paidAt ? new Date(row.paidAt) : null,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date()
        });

        successful++;
      } catch (err) {
        failed++;
        errors.push({
          row: i + 1,
          lineitemId: row.lineitemId,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Update progress every 10 rows
      if (i % 10 === 0) {
        await this.updateImportStatus(importId, {
          processedRecords: i + 1,
          successfulRecords: successful,
          failedRecords: failed
        });
      }
    }

    // Final update
    await this.updateImportStatus(importId, {
      status: failed === csvRows.length ? 'failed' : 'completed',
      processedRecords: csvRows.length,
      successfulRecords: successful,
      failedRecords: failed,
      errorLog: errors.length > 0 ? { errors } : undefined,
      completedAt: new Date()
    });

    return { successful, failed, errors };
  }
}

export const actblueCsvService = new ActBlueCsvService();
