import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from '@sveltejs/kit';

// Import route handlers
import { authRouter } from './auth/routes';
import { graphRouter } from './graph/routes';

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
