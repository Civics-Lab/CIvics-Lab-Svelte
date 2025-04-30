import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Simple echo server that returns the ID
export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;
  console.log(`Echo API called with ID: ${id}`);
  
  return json({
    message: 'Echo endpoint working',
    id,
    timestamp: new Date().toISOString()
  });
};

// PATCH handler to test updates
export const PATCH: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  console.log(`Echo PATCH API called with ID: ${id}`);
  
  const body = await request.json().catch(() => ({}));
  console.log(`Echo PATCH body:`, body);
  
  return json({
    message: 'Echo PATCH working',
    id,
    received: body,
    timestamp: new Date().toISOString()
  });
};
