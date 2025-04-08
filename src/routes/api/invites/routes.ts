import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { inviteService } from './service';
import { workspaceRoleEnum } from '$lib/db/drizzle';

// Define validation schemas
const createInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  workspaceId: z.string().uuid('Invalid workspace ID'),
  role: z.enum(workspaceRoleEnum.enumValues as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid role' })
  })
});

const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required')
});

// Create invites router
export const invitesRouter = new Hono()
  // Create a new invite
  .post('/', zValidator('json', createInviteSchema, (result, c) => {
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
      const { email, workspaceId, role } = c.req.valid('json');
      
      // Get the current user from context (set in auth middleware)
      const user = c.get('user');
      if (!user) {
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
      
      const invite = await inviteService.createInvite({
        email,
        workspaceId,
        role,
        invitedById: user.id
      });
      
      return c.json({
        success: true,
        data: invite
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  })
  
  // Get all invites for a workspace
  .get('/workspace/:workspaceId', async (c) => {
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
      
      const invites = await inviteService.getWorkspaceInvites(workspaceId);
      
      return c.json({
        success: true,
        data: invites
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  })
  
  // Get invites by email (useful during signup)
  .get('/email/:email', async (c) => {
    try {
      const email = c.req.param('email');
      
      const invites = await inviteService.getPendingInvitesByEmail(email);
      
      return c.json({
        success: true,
        data: invites
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  })
  
  // Get invite by token
  .get('/token/:token', async (c) => {
    try {
      const token = c.req.param('token');
      
      const invite = await inviteService.getInviteByToken(token);
      
      if (!invite) {
        return c.json({
          success: false,
          error: 'Invite not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        data: invite
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  })
  
  // Accept an invite
  .post('/accept', zValidator('json', acceptInviteSchema, (result, c) => {
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
      const { token } = c.req.valid('json');
      
      // Get the current user from context (set in auth middleware)
      const user = c.get('user');
      if (!user) {
        return c.json({
          success: false,
          error: 'Unauthorized'
        }, 401);
      }
      
      const result = await inviteService.acceptInvite({
        token,
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
  
  // Decline an invite
  .post('/decline', zValidator('json', acceptInviteSchema, (result, c) => {
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
      const { token } = c.req.valid('json');
      
      const invite = await inviteService.declineInvite(token);
      
      return c.json({
        success: true,
        data: invite
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }, 500);
    }
  });
