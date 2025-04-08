import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invitesRouter } from './routes';

export const GET: RequestHandler = async ({ request, url, locals }) => {
  const path = url.pathname.replace('/api/invites', '');
  const req = new Request(new URL(path, url), {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  // Add user to context from locals
  req.headers.set('user', JSON.stringify(locals.user || null));
  
  try {
    const response = await invitesRouter.fetch(req, {
      env: {},
      executionCtx: {
        waitUntil: () => Promise.resolve(),
        passThroughOnException: () => {}
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw error(response.status, data.error || 'An error occurred');
    }
    
    return json(data);
  } catch (err) {
    if (err instanceof Response) {
      throw err;
    }
    throw error(500, 'Internal server error');
  }
};

export const POST: RequestHandler = GET;
