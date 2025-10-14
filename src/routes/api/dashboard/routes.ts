import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { dashboardService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const statsSchema = z.object({
  workspace_id: z.string().uuid()
});

export const dashboardRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/dashboard/stats - Get aggregate statistics for the dashboard
  .get('/stats', zValidator('query', statsSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const { workspace_id } = c.req.valid('query');
    
    try {
      const stats = await dashboardService.getDashboardStats(workspace_id, userId);
      return c.json(stats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      
      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(500, { message: 'Failed to fetch dashboard stats' });
    }
  });