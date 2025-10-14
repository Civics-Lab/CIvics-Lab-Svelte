import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { contactService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const createContactSchema = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  middleName: z.string().optional(),
  workspaceId: z.string().uuid()
});

const updateContactSchema = z.object({
  firstName: z.string().min(1).trim().optional(),
  lastName: z.string().min(1).trim().optional(),
  middleName: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  workspace_id: z.string().uuid()
});

export const contactRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/contacts - Get all contacts with optional search
  .get('/', zValidator('query', paginationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id, search, page, limit, sortBy, sortOrder } = c.req.valid('query');
    
    try {
      const result = await contactService.getContacts(workspace_id, userId, {
        search,
        limit,
        offset: page && limit ? (page - 1) * limit : 0,
        sortBy,
        sortOrder
      });
      
      return c.json(result);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch contacts' });
    }
  })
  
  // GET /api/contacts/paginated - Get paginated contacts
  .get('/paginated', zValidator('query', paginationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id, search, page, limit, sortBy, sortOrder } = c.req.valid('query');
    
    try {
      const result = await contactService.getContactsPaginated(workspace_id, userId, {
        page,
        limit,
        search,
        sortBy,
        sortOrder
      });
      
      return c.json(result);
    } catch (err) {
      console.error('Error fetching paginated contacts:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch contacts' });
    }
  })
  
  // POST /api/contacts - Create a new contact
  .post('/', zValidator('json', createContactSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const contactData = c.req.valid('json');
    
    try {
      const contact = await contactService.createContact(contactData, contactData.workspaceId, userId);
      return c.json({ contact }, 201);
    } catch (err) {
      console.error('Error creating contact:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to create contact' });
    }
  })
  
  // GET /api/contacts/:id - Get a specific contact
  .get('/:id', zValidator('query', z.object({ workspace_id: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id } = c.req.valid('query');
    
    try {
      const contact = await contactService.getContactById(id, workspace_id, userId);
      return c.json({ contact });
    } catch (err) {
      console.error('Error fetching contact:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Contact not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch contact' });
    }
  })
  
  // PUT /api/contacts/:id - Update a contact
  .put('/:id', zValidator('json', updateContactSchema.extend({ workspaceId: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspaceId, ...updateData } = c.req.valid('json');
    
    try {
      const contact = await contactService.updateContact(id, updateData, workspaceId, userId);
      return c.json({ contact });
    } catch (err) {
      console.error('Error updating contact:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Contact not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to update contact' });
    }
  })
  
  // DELETE /api/contacts/:id - Delete a contact
  .delete('/:id', zValidator('json', z.object({ workspaceId: z.string().uuid() })), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspaceId } = c.req.valid('json');
    
    try {
      const result = await contactService.deleteContact(id, workspaceId, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error deleting contact:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Contact not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to delete contact' });
    }
  });