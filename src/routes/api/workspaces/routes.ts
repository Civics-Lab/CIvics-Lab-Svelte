import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { workspaceService } from './service';

// Define validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Workspace name cannot exceed 100 characters')
});

// Create workspaces router
export const workspacesRouter = new Hono()
  // Create a new workspace
  .post('/', zValidator('json', createWorkspaceSchema, (result, c) => {
    // Handle validation errors
    if (!result.success) {
      return c.json({
        success: false,
        error: 'Validation error',
        details: result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      }, 400);
    }
  }), async (c) => {
    try {
      const { name } = c.req.valid('json');
      
      // Get the current user from context (set in auth middleware)
      const user = c.get('user');
      if (!user) {
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
      
      const result = await workspaceService.createWorkspace({
        name,
        userId: user.id
      });
      
      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  })
  
  // Get all workspaces for the current user
  .get('/user', async (c) => {
    try {
      // Get the current user from context (set in auth middleware)
      const user = c.get('user');
      if (!user) {
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
      
      const workspaces = await workspaceService.getUserWorkspaces({
        userId: user.id
      });
      
      return c.json({
        success: true,
        data: workspaces
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  })
  
  // Check if user has any workspaces
  .get('/user/has-workspaces', async (c) => {
    try {
      // Get the current user from context (set in auth middleware)
      const user = c.get('user');
      if (!user) {
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
      
      const hasWorkspaces = await workspaceService.hasWorkspaces({
        userId: user.id
      });
      
      return c.json({
        success: true,
        data: { hasWorkspaces }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  })
  
  // Get a specific workspace
  .get('/:workspaceId', async (c) => {
    try {
      const workspaceId = c.req.param('workspaceId');
      
      // Get the current user from context (set in auth middleware)
      const user = c.get('user');
      if (!user) {
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
      
      // Check if user is a member of the workspace
      const isMember = await workspaceService.isWorkspaceMember(user.id, workspaceId);
      if (!isMember) {
        return c.json({
          success: false,
          error: 'You do not have access to this workspace'
        }, 403);
      }
      
      const workspace = await workspaceService.getWorkspace(workspaceId);
      
      if (!workspace) {
        return c.json({
          success: false,
          error: 'Workspace not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        data: workspace
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  });
