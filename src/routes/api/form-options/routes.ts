import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { formOptionsService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const optionsSchema = z.object({
  type: z.enum(['states', 'genders', 'races', 'contacts']),
  search: z.string().optional(),
  workspace_id: z.string().uuid().optional()
});

export const formOptionsRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/form-options - Get form dropdown options
  .get('/', zValidator('query', optionsSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { type, search, workspace_id } = c.req.valid('query');
    
    try {
      switch (type) {
        case 'states':
          const states = await formOptionsService.getStates();
          return c.json(states);
          
        case 'genders':
          const genders = await formOptionsService.getGenders();
          return c.json(genders);
          
        case 'races':
          const races = await formOptionsService.getRaces();
          return c.json(races);
          
        case 'contacts':
          if (!workspace_id) {
            throw new HTTPException(400, { message: 'workspace_id is required for contacts' });
          }
          const contacts = await formOptionsService.getContacts(workspace_id, userId, search);
          return c.json(contacts);
          
        default:
          throw new HTTPException(400, { message: `Unsupported option type: ${type}` });
      }
    } catch (err) {
      console.error(`Error fetching ${type} options:`, err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: `Failed to fetch options: ${err.message || 'Unknown error'}` });
    }
  });