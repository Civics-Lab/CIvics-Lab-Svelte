import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { adminService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

export const adminRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))
  
  // GET /api/admin/access - Check if the user has admin access
  .get('/access', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;
    
    try {
      const result = await adminService.checkAdminAccess(userId);
      return c.json(result);
    } catch (err) {
      console.error('Error checking admin access:', err);
      
      if (err instanceof Error) {
        if (err.message === 'Authentication required') {
          throw new HTTPException(401, { message: err.message });
        }
        if (err.message === 'Forbidden - Requires Super Admin privileges') {
          throw new HTTPException(403, { message: err.message });
        }
      }
      
      throw new HTTPException(403, { message: 'Forbidden - Admin access check failed' });
    }
  });