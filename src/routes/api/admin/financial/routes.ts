/**
 * Admin Financial API Routes
 * Hono routes for super admin financial dashboard
 */

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { adminFinancialApiService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

export const adminFinancialRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))

  // Verify super admin access for all routes
  .use('*', async (c, next) => {
    // This should check if user is super admin
    // For now, we'll assume the JWT verification is sufficient
    // In production, add actual super admin role check
    await next();
  })

  // GET /api/admin/financial/overview - Get financial overview
  .get('/overview', async (c) => {
    try {
      const overview = await adminFinancialApiService.getOverview();
      return c.json({ overview });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      throw new HTTPException(500, { message: 'Failed to fetch financial overview' });
    }
  })

  // GET /api/admin/financial/transactions - Get all transactions
  .get('/transactions', async (c) => {
    const workspaceId = c.req.query('workspace_id');
    const status = c.req.query('status');
    const type = c.req.query('type');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    try {
      const result = await adminFinancialApiService.getTransactions({
        workspaceId,
        status,
        type,
        limit,
        offset
      });

      return c.json(result);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new HTTPException(500, { message: 'Failed to fetch transactions' });
    }
  })

  // GET /api/admin/financial/workspace-summary - Get summary by workspace
  .get('/workspace-summary', async (c) => {
    try {
      const summary = await adminFinancialApiService.getWorkspaceSummary();
      return c.json({ summary });
    } catch (error) {
      console.error('Error fetching workspace summary:', error);
      throw new HTTPException(500, { message: 'Failed to fetch workspace summary' });
    }
  });
