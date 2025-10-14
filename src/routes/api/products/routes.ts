import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { productService } from './service';
import { HTTPException } from 'hono/http-exception';
import { env } from '$env/dynamic/private';

const createProductSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  billingPeriod: z.enum(['one_time', 'weekly', 'monthly', 'yearly']),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  billingPeriod: z.enum(['one_time', 'weekly', 'monthly', 'yearly']).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

const getProductsSchema = z.object({
  workspace_id: z.string().uuid(),
  active_only: z.string().transform(val => val === 'true').optional()
});

export const productRouter = new Hono()
  .use('*', jwt({ secret: env.JWT_SECRET || '' }))

  // GET /api/products - Get all products for workspace
  .get('/', zValidator('query', getProductsSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const { workspace_id, active_only } = c.req.valid('query');

    try {
      const result = await productService.getProducts(workspace_id, userId, active_only || false);
      return c.json(result);
    } catch (err) {
      console.error('Error fetching products:', err);

      if (err instanceof Error) {
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to fetch products' });
    }
  })

  // POST /api/products - Create new product
  .post('/', zValidator('json', createProductSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const productData = c.req.valid('json');

    try {
      const product = await productService.createProduct(productData, userId);
      return c.json({ product }, 201);
    } catch (err) {
      console.error('Error creating product:', err);

      if (err instanceof Error) {
        if (err.message === 'Workspace ID is required' ||
            err.message === 'Product name is required' ||
            err.message === 'Valid amount is required' ||
            err.message === 'Billing period is required' ||
            err.message === 'Invalid billing period') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'You do not have permission to access this workspace') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to create product' });
    }
  })

  // GET /api/products/:id - Get specific product
  .get('/:id', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const product = await productService.getProductById(id, userId);
      return c.json({ product });
    } catch (err) {
      console.error('Error fetching product:', err);

      if (err instanceof Error) {
        if (err.message === 'Product not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this product') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to fetch product' });
    }
  })

  // GET /api/products/:id/stats - Get product with statistics
  .get('/:id/stats', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const product = await productService.getProductWithStats(id, userId);
      return c.json({ product });
    } catch (err) {
      console.error('Error fetching product stats:', err);

      if (err instanceof Error) {
        if (err.message === 'Product not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this product') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to fetch product stats' });
    }
  })

  // PUT /api/products/:id - Update product
  .put('/:id', zValidator('json', updateProductSchema), async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const updateData = c.req.valid('json');

    try {
      const product = await productService.updateProduct(id, updateData, userId);
      return c.json({ product });
    } catch (err) {
      console.error('Error updating product:', err);

      if (err instanceof Error) {
        if (err.message === 'Product not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'No valid fields to update' ||
            err.message === 'Invalid billing period') {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'You do not have access to this product') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to update product' });
    }
  })

  // POST /api/products/:id/archive - Archive product
  .post('/:id/archive', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const product = await productService.archiveProduct(id, userId);
      return c.json({ product, success: true });
    } catch (err) {
      console.error('Error archiving product:', err);

      if (err instanceof Error) {
        if (err.message === 'Product not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message === 'You do not have access to this product') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to archive product' });
    }
  })

  // DELETE /api/products/:id - Delete product
  .delete('/:id', async (c) => {
    const { id } = c.req.param();
    const payload = c.get('jwtPayload');
    const userId = payload.userId as string;

    if (!userId) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    try {
      const result = await productService.deleteProduct(id, userId);
      return c.json(result);
    } catch (err) {
      console.error('Error deleting product:', err);

      if (err instanceof Error) {
        if (err.message === 'Product not found') {
          throw new HTTPException(404, { message: err.message });
        }
        if (err.message.includes('Cannot delete product with active subscriptions')) {
          throw new HTTPException(400, { message: err.message });
        }
        if (err.message === 'You do not have access to this product') {
          throw new HTTPException(403, { message: err.message });
        }
      }

      throw new HTTPException(500, { message: 'Failed to delete product' });
    }
  });
