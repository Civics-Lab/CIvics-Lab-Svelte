import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { inviteService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

// Validation schemas
const createInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  workspaceId: z.string().uuid('Invalid workspace ID')
});

const cancelInviteSchema = z.object({
  inviteId: z.string().uuid('Invalid invite ID'),
  workspaceId: z.string().uuid('Invalid workspace ID')
});

const processInviteSchema = z.object({
  action: z.enum(['accept', 'decline'])
});

const workspaceQuerySchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID')
});

export const inviteRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/invites - Get all invites for a workspace
  .get('/', zValidator('query', workspaceQuerySchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspaceId } = c.req.valid('query');
    
    try {
      const result = await inviteService.getInvitesForWorkspace(workspaceId, userId);
      return c.json({ success: true, data: result.invites });
    } catch (err) {
      console.error('Error fetching invites:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('access')) {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch invites' });
    }
  })

  // POST /api/invites - Create a new invite
  .post('/', zValidator('json', createInviteSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { email, role, workspaceId } = c.req.valid('json');
    
    try {
      const result = await inviteService.createInvite(workspaceId, userId, email, role);
      return c.json({ success: true, ...result });
    } catch (err) {
      console.error('Error creating invite:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission') || err.message.includes('Invalid email')) {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message.includes('required')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to create invite' });
    }
  })

  // DELETE /api/invites - Cancel an invite
  .delete('/', zValidator('json', cancelInviteSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { inviteId, workspaceId } = c.req.valid('json');
    
    try {
      const result = await inviteService.cancelInvite(workspaceId, userId, inviteId);
      return c.json({ success: true, ...result });
    } catch (err) {
      console.error('Error cancelling invite:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission')) {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('required')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to cancel invite' });
    }
  })

  // GET /api/invites/:token - Get an invitation by token
  .get('/:token', async (c) => {
    const token = c.req.param('token');
    
    try {
      const result = await inviteService.getInviteByToken(token);
      return c.json(result);
    } catch (err) {
      console.error('Error getting invitation by token:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('required')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to get invitation' });
    }
  })

  // POST /api/invites/:token - Accept or decline an invitation
  .post('/:token', zValidator('json', processInviteSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const token = c.req.param('token');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { action } = c.req.valid('json');
    
    try {
      const result = await inviteService.processInvite(token, userId, action);
      return c.json(result);
    } catch (err) {
      console.error('Error processing invitation:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('Authentication required') || err.message.includes('required')) {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message.includes('Invalid action')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to process invitation' });
    }
  });