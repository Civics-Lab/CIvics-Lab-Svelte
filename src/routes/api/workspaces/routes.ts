import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { workspaceService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const createWorkspaceSchema = z.object({
  name: z.string().min(1).trim()
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).trim().optional()
});

const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.string().optional()
});

const updateMemberRoleSchema = z.object({
  role: z.string().min(1, 'Role is required')
});

export const workspaceRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/workspaces - Get all workspaces for the current user
  .get('/', async (c) => {
    console.log('API: GET /api/workspaces - Start');
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      console.error('No authenticated user found in JWT payload');
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    console.log('API: Getting workspaces for user:', userId);
    
    try {
      const result = await workspaceService.getWorkspacesForUser(userId);
      return c.json(result);
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        console.error('Error stack:', err.stack);
      }
      throw new HTTPException(500, { message: 'Failed to fetch workspaces' });
    }
  })
  
  // POST /api/workspaces - Create a new workspace
  .post('/', zValidator('json', createWorkspaceSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { name } = c.req.valid('json');
    
    try {
      const workspace = await workspaceService.createWorkspace(userId, name);
      return c.json({ workspace }, 201);
    } catch (err) {
      console.error('Error creating workspace:', err);
      
      if (err instanceof Error) {
        if (err.message === 'User not found in database') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'Workspace name is required') {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to create workspace' });
    }
  })
  
  // GET /api/workspaces/:workspaceId - Get a specific workspace
  .get('/:workspaceId', async (c) => {
    const { workspaceId } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    console.log(`GET workspace ${workspaceId} request from user ${userId}`);
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const workspace = await workspaceService.getWorkspace(workspaceId, userId);
      return c.json({ workspace });
    } catch (err) {
      console.error('Error fetching workspace:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Workspace not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch workspace' });
    }
  })
  
  // PUT /api/workspaces/:workspaceId - Update a workspace
  .put('/:workspaceId', zValidator('json', updateWorkspaceSchema), async (c) => {
    const { workspaceId } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    console.log(`PUT workspace ${workspaceId} request from user ${userId}`);
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const updates = c.req.valid('json');
    
    try {
      const workspace = await workspaceService.updateWorkspace(workspaceId, userId, updates);
      return c.json({ workspace });
    } catch (err) {
      console.error('Error updating workspace:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Workspace not found' || err.message === 'Workspace not found in database') {
          throw new HTTPException(404, { message: 'Workspace not found' });
        }
        if (err.message === 'You do not have permission to update this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message === 'No valid update fields provided') {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to update workspace' });
    }
  })
  
  // DELETE /api/workspaces/:workspaceId - Delete a workspace
  .delete('/:workspaceId', async (c) => {
    const { workspaceId } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    console.log(`API: DELETE /api/workspaces/${workspaceId} - Start`);
    
    if (!userId) {
      console.error('No authenticated user found in JWT payload');
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    console.log(`User ${userId} attempting to delete workspace ${workspaceId}`);
    
    try {
      const result = await workspaceService.deleteWorkspace(workspaceId, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error deleting workspace:', err);
      
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        
        if (err.message === 'Workspace not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'Only Super Admins can delete workspaces') {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message === 'Cannot delete your only workspace. Create a new workspace first.') {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to delete workspace' });
    }
  })

  // Workspace Members Management
  // GET /api/workspaces/:workspaceId/members - Get workspace members
  .get('/:workspaceId/members', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const workspaceId = c.req.param('workspaceId');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const result = await workspaceService.getWorkspaceMembers(workspaceId, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error fetching workspace members:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('permission')) {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch workspace members' });
    }
  })

  // POST /api/workspaces/:workspaceId/members - Add workspace member
  .post('/:workspaceId/members', zValidator('json', addMemberSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const workspaceId = c.req.param('workspaceId');
    const { userId: newUserId, role } = c.req.valid('json');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const result = await workspaceService.addWorkspaceMember(workspaceId, userId, newUserId, role);
      return c.json({ success: true, ...result });
    } catch (err) {
      console.error('Error adding member to workspace:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('permission') || err.message.includes('already a member')) {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message.includes('required')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to add member to workspace' });
    }
  })

  // GET /api/workspaces/:workspaceId/members/:memberId - Get specific workspace member
  .get('/:workspaceId/members/:memberId', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const workspaceId = c.req.param('workspaceId');
    const memberId = c.req.param('memberId');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const result = await workspaceService.getWorkspaceMember(workspaceId, userId, memberId);
      return c.json(result);
    } catch (err) {
      console.error('Error fetching workspace member:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('permission')) {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch workspace member' });
    }
  })

  // PATCH /api/workspaces/:workspaceId/members/:memberId - Update member role
  .patch('/:workspaceId/members/:memberId', zValidator('json', updateMemberRoleSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const workspaceId = c.req.param('workspaceId');
    const memberId = c.req.param('memberId');
    const { role } = c.req.valid('json');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const result = await workspaceService.updateWorkspaceMemberRole(workspaceId, userId, memberId, role);
      return c.json({ success: true, ...result });
    } catch (err) {
      console.error('Error updating member role:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('permission') || err.message.includes('cannot downgrade')) {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message.includes('required')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to update member role' });
    }
  })

  // DELETE /api/workspaces/:workspaceId/members/:memberId - Remove workspace member
  .delete('/:workspaceId/members/:memberId', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const workspaceId = c.req.param('workspaceId');
    const memberId = c.req.param('memberId');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const result = await workspaceService.removeWorkspaceMember(workspaceId, userId, memberId);
      return c.json({ success: true, ...result });
    } catch (err) {
      console.error('Error removing member from workspace:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('permission') || err.message.includes('cannot remove yourself')) {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to remove member from workspace' });
    }
  })

  // Workspace Logo Management
  // PUT /api/workspaces/:workspaceId/logo - Update workspace logo
  .put('/:workspaceId/logo', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const workspaceId = c.req.param('workspaceId');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const formData = await c.req.formData();
      const logoFile = formData.get('logo');
      
      if (!logoFile || !(logoFile instanceof File)) {
        throw new HTTPException(400, { message: 'No logo file provided' });
      }
      
      const result = await workspaceService.updateWorkspaceLogo(workspaceId, userId, logoFile);
      return c.json({ success: true, ...result });
    } catch (err) {
      if (err instanceof HTTPException) {
        throw err;
      }
      
      console.error('Error updating workspace logo:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission')) {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('No logo file')) {
          throw new HTTPException(400, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to update workspace logo' });
    }
  })

  // DELETE /api/workspaces/:workspaceId/logo - Remove workspace logo
  .delete('/:workspaceId/logo', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    const workspaceId = c.req.param('workspaceId');
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const result = await workspaceService.removeWorkspaceLogo(workspaceId, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error removing workspace logo:', err);
      
      if (err instanceof Error) {
        if (err.message.includes('permission')) {
          throw new HTTPException(403, { message: err.message });
        }
        if (err.message.includes('not found')) {
          throw new HTTPException(404, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to remove workspace logo' });
    }
  })
  
  // OPTIONS /api/workspaces - Debug endpoint
  .options('/', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const debugInfo = await workspaceService.getDebugInfo(userId);
      return c.json(debugInfo);
    } catch (err) {
      console.error('Error in debug endpoint:', err);
      throw new HTTPException(500, { message: 'Debug info failed' });
    }
  });