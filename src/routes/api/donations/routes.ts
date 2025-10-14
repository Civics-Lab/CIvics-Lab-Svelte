import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { donationService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const createDonationSchema = z.object({
  amount: z.number().positive(),
  contactId: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  status: z.enum(['promise', 'received', 'cancelled']).optional(),
  paymentType: z.string().optional(),
  notes: z.string().optional()
}).refine(data => data.contactId || data.businessId, {
  message: "Either contactId or businessId is required"
}).refine(data => !(data.contactId && data.businessId), {
  message: "Cannot specify both contactId and businessId"
});

const updateDonationSchema = z.object({
  donationData: z.object({
    amount: z.number().positive().optional(),
    contactId: z.string().uuid().optional(),
    businessId: z.string().uuid().optional(),
    status: z.enum(['promise', 'received', 'cancelled']).optional(),
    paymentType: z.string().optional(),
    notes: z.string().optional()
  }),
  tags: z.array(z.string()).optional()
});

const paginationSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  filters: z.string().transform(str => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }).optional(),
  sorting: z.string().transform(str => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }).optional(),
  workspace_id: z.string().uuid()
});

export const donationRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/donations - Get all donations for workspace
  .get('/', zValidator('query', z.object({ workspace_id: z.string().uuid() })), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id } = c.req.valid('query');
    
    try {
      const result = await donationService.getDonations(workspace_id, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error fetching donations:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch donations' });
    }
  })
  
  // GET /api/donations/paginated - Get paginated donations
  .get('/paginated', zValidator('query', paginationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id, page, limit, search, filters, sorting } = c.req.valid('query');
    
    try {
      const result = await donationService.getDonationsPaginated(workspace_id, userId, {
        page,
        limit,
        search,
        filters,
        sorting
      });
      
      return c.json(result);
    } catch (err) {
      console.error('Error fetching paginated donations:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch donations' });
    }
  })
  
  // POST /api/donations - Create new donation
  .post('/', zValidator('json', createDonationSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const donationData = c.req.valid('json');
    
    try {
      const donation = await donationService.createDonation(donationData, userId);
      return c.json({ donation }, 201);
    } catch (err) {
      console.error('Error creating donation:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Valid amount is required') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'Either contactId or businessId is required') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'Only one of contactId or businessId should be provided') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'Contact not found' || err.message === 'Business not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to create donation' });
    }
  })
  
  // GET /api/donations/:id - Get specific donation
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const donation = await donationService.getDonationById(id, userId);
      return c.json({ donation });
    } catch (err) {
      console.error('Error fetching donation:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Donation not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'Contact not found' || err.message === 'Business not found') {
          throw new HTTPException(404, { message: 'Associated contact or business not found' });
        }
        if (err.message === 'You do not have access to this donation') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch donation' });
    }
  })
  
  // PUT /api/donations/:id - Update donation
  .put('/:id', zValidator('json', updateDonationSchema), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const updateData = c.req.valid('json');
    
    try {
      const donation = await donationService.updateDonation(id, updateData, userId);
      return c.json({ donation });
    } catch (err) {
      console.error('Error updating donation:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Donation not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'Donation data is required') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'No valid fields to update') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'Contact not found' || err.message === 'Business not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'Cannot specify both contactId and businessId') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'You do not have access to this contact' || 
            err.message === 'You do not have access to this business' ||
            err.message === 'You do not have access to this donation') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to update donation' });
    }
  })
  
  // DELETE /api/donations/:id - Delete donation
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    try {
      const result = await donationService.deleteDonation(id, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error deleting donation:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Donation not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'Contact not found' || err.message === 'Business not found') {
          throw new HTTPException(404, { message: 'Associated contact or business not found' });
        }
        if (err.message === 'You do not have access to this donation') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to delete donation' });
    }
  });