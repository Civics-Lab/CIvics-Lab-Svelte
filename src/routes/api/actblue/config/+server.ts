import type { RequestHandler } from '@sveltejs/kit';
import { actblueConfigRouter } from './routes';

// Export all HTTP methods to handle Hono routes through SvelteKit
export const GET: RequestHandler = async ({ request }) => {
  return await actblueConfigRouter.fetch(request);
};

export const POST: RequestHandler = async ({ request }) => {
  return await actblueConfigRouter.fetch(request);
};

export const PUT: RequestHandler = async ({ request }) => {
  return await actblueConfigRouter.fetch(request);
};

export const DELETE: RequestHandler = async ({ request }) => {
  return await actblueConfigRouter.fetch(request);
};

export const PATCH: RequestHandler = async ({ request }) => {
  return await actblueConfigRouter.fetch(request);
};
