import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// GET /api/test-workspaces/[id] - Simple test endpoint for dynamic routes
export const GET: RequestHandler = async ({ params, url }) => {
  console.log(`Test workspaces ID parameter endpoint called with id: ${params.id}`);
  
  return json({
    message: 'Dynamic ID parameter test endpoint',
    id: params.id,
    url: url.toString(),
    params,
    path: url.pathname
  });
};

// PATCH /api/test-workspaces/[id] - Test PATCH with dynamic ID
export const PATCH: RequestHandler = async ({ params, request, url }) => {
  console.log(`Test workspaces ID PATCH endpoint called with id: ${params.id}`);
  console.log(`Request URL:`, url.toString());
  console.log(`Headers:`, Object.fromEntries([...request.headers]));
  
  try {
    const body = await request.json();
    console.log(`Request body:`, body);
    
    return json({
      message: 'Dynamic ID parameter PATCH received',
      id: params.id,
      url: url.toString(),
      body,
      headers: Object.fromEntries([...request.headers])
    });
  } catch (err) {
    console.error('Error processing request:', err);
    return json({ error: 'Failed to process request' }, { status: 400 });
  }
};
