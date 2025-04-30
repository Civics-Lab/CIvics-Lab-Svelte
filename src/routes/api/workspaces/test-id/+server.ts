import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, params }) => {
  return json({
    message: 'Route parameters test',
    url: url.toString(),
    params,
    query: Object.fromEntries(url.searchParams),
    path: url.pathname,
    segments: url.pathname.split('/')
  });
};

export const PATCH: RequestHandler = async ({ request, url, params }) => {
  try {
    const body = await request.json();
    return json({
      message: 'PATCH request received',
      url: url.toString(),
      params,
      body,
      headers: Object.fromEntries([...request.headers])
    });
  } catch (err) {
    return json({ error: 'Failed to process request' }, { status: 400 });
  }
};
