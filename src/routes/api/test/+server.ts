import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/test - Simple test endpoint
export const GET: RequestHandler = async () => {
  console.log('Test endpoint called');
  return json({ message: 'API is working', timestamp: new Date().toISOString() });
};

// POST /api/test - Test POST endpoint
export const POST: RequestHandler = async ({ request }) => {
  console.log('Test POST endpoint called');
  
  try {
    const body = await request.json();
    console.log('Received body:', body);
    
    return json({ 
      message: 'POST request received',
      receivedData: body,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('Error processing request:', err);
    return json({ error: 'Failed to process request' }, { status: 400 });
  }
};

// PATCH /api/test - Test PATCH endpoint
export const PATCH: RequestHandler = async ({ request }) => {
  console.log('Test PATCH endpoint called');
  
  try {
    const body = await request.json();
    console.log('Received PATCH body:', body);
    
    return json({ 
      message: 'PATCH request received',
      receivedData: body,
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('Error processing PATCH request:', err);
    return json({ error: 'Failed to process PATCH request' }, { status: 400 });
  }
};
