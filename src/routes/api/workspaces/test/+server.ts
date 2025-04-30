import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// GET /api/workspaces/test - Simple test endpoint for workspaces API
export const GET: RequestHandler = async ({ url, params }) => {
  console.log('Workspaces test endpoint called');
  console.log('URL:', url.toString());
  console.log('Params:', params);
  
  return json({ 
    message: 'Workspaces API test endpoint is working', 
    timestamp: new Date().toISOString(),
    params
  });
};

// PATCH /api/workspaces/test - Test PATCH endpoint for workspaces API
export const PATCH: RequestHandler = async ({ request, url, params }) => {
  console.log('Workspaces test PATCH endpoint called');
  console.log('URL:', url.toString());
  console.log('Params:', params);
  
  try {
    const body = await request.json();
    console.log('Received body:', body);
    
    return json({ 
      message: 'PATCH request to workspaces test received',
      receivedData: body,
      timestamp: new Date().toISOString(),
      params
    });
  } catch (err) {
    console.error('Error processing request:', err);
    return json({ error: 'Failed to process request' }, { status: 400 });
  }
};
