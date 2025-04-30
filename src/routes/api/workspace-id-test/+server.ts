import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Special diagnostic endpoints to test workspace ID routing
 */

// GET /api/workspace-id-test - Returns info about the request
export const GET: RequestHandler = async ({ url, params }) => {
  console.log('Workspace ID test GET endpoint called');
  console.log('URL:', url.toString());
  console.log('Params:', params);
  
  return json({ 
    message: 'Workspace ID test endpoint is working', 
    timestamp: new Date().toISOString(),
    url: url.toString(),
    params,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams)
  });
};

// PATCH /api/workspace-id-test - Test PATCH endpoint 
export const PATCH: RequestHandler = async ({ request, url, params }) => {
  console.log('Workspace ID test PATCH endpoint called');
  console.log('URL:', url.toString());
  console.log('Params:', params);
  console.log('Headers:', Object.fromEntries([...request.headers]));
  
  try {
    const body = await request.json();
    console.log('Received body:', body);
    
    return json({ 
      message: 'PATCH request to workspace ID test endpoint received',
      receivedData: body,
      timestamp: new Date().toISOString(),
      url: url.toString(),
      params,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: Object.fromEntries([...request.headers])
    });
  } catch (err) {
    console.error('Error processing request:', err);
    return json({ error: 'Failed to process request' }, { status: 400 });
  }
};
