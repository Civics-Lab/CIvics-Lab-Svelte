import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { businessService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const createBusinessSchema = z.object({
  businessName: z.string().min(1).trim(),
  workspaceId: z.string().uuid()
});

const updateBusinessSchema = z.object({
  businessName: z.string().min(1).trim().optional(),
});

const paginationSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  workspace_id: z.string().uuid()
});

export const businessRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/businesses - Get all businesses with optional search
  .get('/', zValidator('query', paginationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id, search, page, limit, sortBy, sortOrder } = c.req.valid('query');
    
    try {
      const result = await businessService.getBusinesses(workspace_id, userId, {
        search,
        limit,
        offset: page && limit ? (page - 1) * limit : 0,
        sortBy,
        sortOrder
      });
      
      return c.json(result);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch businesses' });
    }
  })
  
  // GET /api/businesses/paginated - Get paginated businesses
  .get('/paginated', zValidator('query', paginationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id, search, page, limit, sortBy, sortOrder } = c.req.valid('query');
    
    try {
      const result = await businessService.getBusinessesPaginated(workspace_id, userId, {
        page,
        limit,
        search,
        sortBy,
        sortOrder
      });
      
      return c.json(result);
    } catch (err) {
      console.error('Error fetching paginated businesses:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch businesses' });
    }
  })
  
  // POST /api/businesses - Create a new business
  .post('/', zValidator('json', createBusinessSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const businessData = c.req.valid('json');
    
    try {
      const business = await businessService.createBusiness(businessData, businessData.workspaceId, userId);
      return c.json({ business }, 201);
    } catch (err) {
      console.error('Error creating business:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to create business' });
    }
  })
  
  // GET /api/businesses/:id - Get a specific business
  .get('/:id', zValidator('query', z.object({ workspace_id: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id } = c.req.valid('query');
    
    try {
      const business = await businessService.getBusinessById(id, workspace_id, userId);
      return c.json({ business });
    } catch (err) {
      console.error('Error fetching business:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Business not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch business' });
    }
  })
  
  // PUT /api/businesses/:id - Update a business
  .put('/:id', zValidator('json', updateBusinessSchema.extend({ workspaceId: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspaceId, ...updateData } = c.req.valid('json');
    
    try {
      const business = await businessService.updateBusiness(id, updateData, workspaceId, userId);
      return c.json({ business });
    } catch (err) {
      console.error('Error updating business:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Business not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to update business' });
    }
  })
  
  // DELETE /api/businesses/:id - Delete a business
  .delete('/:id', zValidator('json', z.object({ workspaceId: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspaceId } = c.req.valid('json');
    
    try {
      const result = await businessService.deleteBusiness(id, workspaceId, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error deleting business:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Business not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to delete business' });
    }
  });