import { sequence } from '@sveltejs/kit/hooks';
import { db } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

// Function to verify JWT token
const verifyToken = (token: string, secret: string): any => {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      console.error('Invalid token format');
      return null;
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    
    if (expectedSignature !== signatureB64) {
      console.error('Invalid token signature');
      return null;
    }
    
    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
      
      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.error('Token expired');
        return null;
      }
      
      return payload;
    } catch (error) {
      console.error('Invalid token payload');
      return null;
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Ensure db is initialized on server start
const dbInitializer: Handle = async ({ event, resolve }) => {
  try {
    // Simply accessing the db object will initialize it if needed
    if (db) {
      // Add db to event.locals for easy access
      event.locals.db = db;
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
  
  return resolve(event);
};

// Authentication handler
const authHandler: Handle = async ({ event, resolve }) => {
  // Get token from cookies
  const authCookie = event.cookies.get('auth_token');
  
  // Also check Authorization header (for API requests)
  const authHeader = event.request.headers.get('Authorization');
  
  let token = authCookie;
  let tokenSource = 'cookie';
  
  // If no cookie, try the Authorization header
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    tokenSource = 'header';
  }
  
  // Log the path being accessed
  console.log(`Auth check for path: ${event.url.pathname}`);
  
  if (token) {
    try {
      // Verify and decode token
      console.log(`Verifying token from ${tokenSource}`);
      console.log(`JWT secret available: ${!!env.JWT_SECRET}`);
      console.log(`JWT secret length: ${env.JWT_SECRET?.length || 0}`);
      console.log(`Token first 20 chars: ${token.substring(0, 20)}...`);
      console.log(`Environment: ${env.NODE_ENV}`);
      
      // In production, we'll use the PRODUCTION_JWT_SECRET if available
      let secretToUse = env.JWT_SECRET;
      if (env.NODE_ENV === 'production' && env.PRODUCTION_JWT_SECRET) {
        console.log('Using production JWT secret');
        secretToUse = env.PRODUCTION_JWT_SECRET;
      }
      
      const payload = verifyToken(token, secretToUse);
      
      if (payload) {
        console.log('Valid token found, user authenticated:', payload.username);
        // Set user info in locals
        event.locals.user = {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role
        };
      } else {
        console.log('Invalid token - verification failed');
        // Try to parse the token anyway for debugging
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const rawPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            console.log('Token payload (invalid signature):', rawPayload);
            console.log('Token expiration time:', new Date(rawPayload.exp * 1000).toISOString());
          }
        } catch (e) {
          console.error('Failed to parse invalid token', e);
        }
        event.locals.user = null;
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      event.locals.user = null;
    }
  } else {
    console.log('No auth token found for path:', event.url.pathname);
    event.locals.user = null;
  }
  
  // Always proceed to the route handler
  return resolve(event);
};

// Path selection handler to determine which API implementation to use
const routeHandler: Handle = async ({ event, resolve }) => {
  // Log the path being accessed
  console.log(`Route handler for path: ${event.url.pathname}`);
  
  // Special handling for the workspace API routes
  if (event.url.pathname.startsWith('/api/workspaces/')) {
    // This is a workspace API request, log detailed info
    console.log(`API Request: ${event.request.method} ${event.url.pathname}`);
    console.log(`API Content-Type: ${event.request.headers.get('content-type')}`);
    
    // For PATCH requests to workspaces with ID, capture the body for debugging
    if (
      event.request.method === 'PATCH' && 
      /^\/api\/workspaces\/[\w-]+$/.test(event.url.pathname)
    ) {
      try {
        // Clone the request so we can read the body without consuming it
        const clonedRequest = event.request.clone();
        const body = await clonedRequest.json();
        console.log(`PATCH Request Body:`, body);
      } catch (err) {
        console.error('Error reading request body for logging:', err);
      }
    }
  }
  
  return resolve(event);
};

// Workspace handler - to check for current workspace in cookies
const workspaceHandler: Handle = async ({ event, resolve }) => {
  // Check for current workspace ID in cookies
  const workspaceId = event.cookies.get('current_workspace_id');
  
  if (workspaceId) {
    console.log(`Checking workspace ${workspaceId}`);
    // If found, add to locals
    try {
      // Check if this workspace exists and user has access to it
      if (event.locals.user && event.locals.db) {
        const { db } = event.locals;
        const userId = event.locals.user.id;
        
        // Query the workspace to see if it exists
        const workspace = await db.query.workspaces.findFirst({
          where: (workspaces, { eq }) => eq(workspaces.id, workspaceId)
        });
        
        if (workspace) {
          console.log(`Found workspace: ${workspace.name}`);
          
          // Check if user has access to this workspace
          const userWorkspace = await db.query.userWorkspaces.findFirst({
            where: (userWorkspaces, { eq, and }) => and(
              eq(userWorkspaces.userId, userId),
              eq(userWorkspaces.workspaceId, workspaceId)
            )
          });
          
          if (userWorkspace) {
            console.log(`User ${userId} has access to workspace ${workspaceId} with role ${userWorkspace.role}`);
            
            // Add it to locals for all server components to access
            event.locals.currentWorkspace = workspace;
          } else {
            console.log(`User ${userId} does not have access to workspace ${workspaceId}`);
            // Don't add to locals, but don't clear the cookie either
            // The application will handle showing an access denied message
          }
        } else {
          console.log(`Workspace ${workspaceId} not found in database`);
          // Cookie refers to a workspace that doesn't exist, clear it
          event.cookies.set('current_workspace_id', '', { path: '/', maxAge: 0 });
        }
      }
    } catch (error) {
      console.error('Error checking workspace:', error);
    }
  } else {
    console.log('No current workspace ID found in cookies');
  }
  
  return resolve(event);
};

// Export the handle sequence - add workspaceHandler to the sequence
export const handle = sequence(dbInitializer, authHandler, workspaceHandler, routeHandler);
