
// A diagnostic utility to help catch and debug API requests
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// This will catch any requests to the workspaces API
export const GET: RequestHandler = async (event) => {
  console.log('Catch-all GET handler called with:', {
    url: event.url.toString(),
    params: event.params,
    path: event.url.pathname
  });
  
  return json({
    message: 'Diagnostic catch-all handler triggered',
    url: event.url.toString(),
    params: event.params,
    path: event.url.pathname
  });
};

export const PATCH: RequestHandler = async (event) => {
  console.log('Catch-all PATCH handler called with:', {
    url: event.url.toString(),
    params: event.params,
    path: event.url.pathname
  });
  
  return json({
    message: 'Diagnostic catch-all handler triggered',
    url: event.url.toString(),
    params: event.params,
    path: event.url.pathname
  });
};
