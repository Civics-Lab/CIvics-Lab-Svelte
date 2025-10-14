import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

// Import route handlers
import { authRouter } from './auth/routes';
import { graphRouter } from './graph/routes';
import { workspaceRouter } from './workspaces/routes';
import { contactRouter } from './contacts/routes';
import { businessRouter } from './businesses/routes';
import { donationRouter } from './donations/routes';
import { dashboardRouter } from './dashboard/routes';
import { formOptionsRouter } from './form-options/routes';
import { adminRouter } from './admin/routes';
import { importExportRouter } from './import-export/routes';
import { inviteRouter } from './invites-new/routes';
import { productRouter } from './products/routes';

// Create main Hono app
const app = new Hono()
  // Global middleware
  .use('*', cors({
    origin: ['http://localhost:5173', 'https://civics-lab.vercel.app'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type']
  }))
  
  // Route handlers
  .route('/auth', authRouter)
  .route('/graph', graphRouter)
  .route('/workspaces', workspaceRouter)
  .route('/contacts', contactRouter)
  .route('/businesses', businessRouter)
  .route('/donations', donationRouter)
  .route('/products', productRouter)
  .route('/dashboard', dashboardRouter)
  .route('/form-options', formOptionsRouter)
  .route('/admin', adminRouter)
  .route('/import-export', importExportRouter)
  .route('/invites-new', inviteRouter)
  
  // Health check endpoint for testing
  .get('/health', (c) => {
    return c.json({
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV || 'development'
    });
  })
  
  // Error handling for 404 routes
  .notFound((c) => {
    return c.json({
      success: false,
      error: 'Endpoint not found'
    }, 404);
  });

// SvelteKit handler functions that connect to Hono
export const GET: RequestHandler = async ({ request }) => {
  return await app.fetch(request);
};

export const POST: RequestHandler = async ({ request }) => {
  return await app.fetch(request);
};

export const PUT: RequestHandler = async ({ request }) => {
  return await app.fetch(request);
};

export const DELETE: RequestHandler = async ({ request }) => {
  return await app.fetch(request);
};

export const PATCH: RequestHandler = async ({ request }) => {
  return await app.fetch(request);
};

export const OPTIONS: RequestHandler = async ({ request }) => {
  return await app.fetch(request);
};
