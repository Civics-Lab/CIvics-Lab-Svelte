// src/hooks.server.ts
import { verify } from 'hono/jwt';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db, workspaces } from '$lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { runAutoMigrations } from '$lib/db/auto-migrate';

// Run auto-migrations when server starts
runAutoMigrations().then(success => {
  if (success) {
    console.log('Auto-migrations completed successfully');
  } else {
    console.error('Failed to run auto-migrations');
  }
});

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize user auth state
  event.locals.user = undefined;
  event.locals.token = undefined;
  event.locals.currentWorkspace = undefined;

  // First check for JWT token in Authorization header
  let token;
  const authHeader = event.request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // Then check for token in cookies if not found in header
  if (!token) {
    token = event.cookies.get('auth_token');
  }
  
  if (token) {
    try {
      // Verify the JWT token
      const payload = await verify(token, env.JWT_SECRET);
      
      // Set user and token in locals
      event.locals.user = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        role: payload.role
      };
      event.locals.token = token;
      
      // Check for workspace ID
      const workspaceId = event.request.headers.get('X-Workspace-ID') || 
                          event.url.searchParams.get('workspaceId') || 
                          event.cookies.get('currentWorkspaceId');
      
      if (workspaceId) {
        try {
          // Fetch workspace details to ensure it exists
          const workspace = await db.query.workspaces.findFirst({
            where: eq(workspaces.id, workspaceId),
            columns: {
              id: true,
              name: true
            }
          });
          
          if (workspace) {
            event.locals.currentWorkspace = workspace;
          }
        } catch (error) {
          console.error('Failed to fetch workspace:', error);
        }
      }
    } catch (error) {
      // Invalid token, continue as unauthenticated
      console.error('Invalid JWT token:', error);
    }
  }

  // Continue with request
  return resolve(event);
}
