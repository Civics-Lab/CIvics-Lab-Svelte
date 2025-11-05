/**
 * Admin Financial API Service
 * Business logic for super admin financial endpoints
 */

import * as adminFinancialService from '$lib/services/adminFinancialService';

export const adminFinancialApiService = {
  /**
   * Get financial overview
   */
  async getOverview() {
    return await adminFinancialService.getFinancialOverview();
  },

  /**
   * Get all transactions with filtering
   */
  async getTransactions(filters: any) {
    return await adminFinancialService.getAllTransactions(filters);
  },

  /**
   * Get transaction summary by workspace
   */
  async getWorkspaceSummary() {
    return await adminFinancialService.getTransactionSummaryByWorkspace();
  }
};
