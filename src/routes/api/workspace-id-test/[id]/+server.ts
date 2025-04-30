import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Test dynamic route parameter handling
 */

// GET /api/workspace-id-test/[id] - Test dynamic route parameter
export const GET: RequestHandler = async ({ params, url }) => {
  console.log('Dynamic ID test GET endpoint called');
  console.log('URL:', url.toString());
  console.log('Params:', params);
  
  return json({ 
    message: 'Dynamic ID test endpoint is working', 
    timestamp: new Date().toISOString(),
    id: params.id,
    url: url.toString(),
    params,
    path: url.pathname
  });
};

// PATCH /api/workspace-id-test/[id] - Test dynamic route parameter with PATCH
export const PATCH: RequestHandler = async ({ params, request, url }) => {
  console.log('Dynamic ID test PATCH endpoint called');
  console.log('URL:', url.toString());
  console.log('Params:', params);
  console.log('Headers:', Object.fromEntries([...request.headers]));
  
  try {
    const body = await request.json();
    console.log('Received body:', body);
    
    return json({ 
      message: 'PATCH request to dynamic ID test endpoint received',
      id: params.id,
      receivedData: body,
      timestamp: new Date().toISOString(),
      url: url.toString(),
      params,
      path: url.pathname,
      headers: Object.fromEntries([...request.headers])
    });
  } catch (err) {
    console.error('Error processing request:', err);
    return json({ error: 'Failed to process request' }, { status: 400 });
  }
};
