import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { env } from '$env/dynamic/private';

// Create auth middleware with custom error handling
export const authMiddleware = (app: Hono) => {
  return app.use(
    '*',
    jwt({
      secret: env.JWT_SECRET,
      // Custom error handling for invalid tokens
      message: 'Unauthorized: Invalid or expired token'
    }),
    // Second middleware to format the response for errors
    async (c, next) => {
      try {
        await next();
      } catch (error) {
        if (error instanceof Error) {
          return c.json({
            success: false,
            error: error.message
          }, 401);
        }
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
    }
  );
};

// Middleware to verify user roles
export const requireRole = (role: string) => {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('jwtPayload');
    
    if (!user || user.role !== role) {
      return c.json({
        success: false,
        error: 'Access denied: Insufficient permissions'
      }, 403);
    }
    
    await next();
  };
};

// Middleware to verify workspace access
export const requireWorkspaceAccess = () => {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('jwtPayload');
    const workspaceId = c.req.param('workspaceId') || c.req.query('workspaceId');
    
    if (!workspaceId) {
      return c.json({
        success: false,
        error: 'Workspace ID is required'
      }, 400);
    }
    
    // The actual workspaces access check will happen in the handler
    // but we set the workspaceId and userId in context for easy access
    c.set('workspaceId', workspaceId);
    c.set('userId', user.id);
    
    await next();
  };
};
