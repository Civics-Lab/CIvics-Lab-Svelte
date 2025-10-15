import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { productService } from '../../service';

// GET /api/products/:id/stats - Get product with statistics
export const GET: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Product ID is required');
  }

  try {
    const product = await productService.getProductWithStats(id, user.id);
    return json({ product });
  } catch (err) {
    console.error('Error fetching product stats:', err);

    if (err instanceof Response) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.message === 'Product not found') {
        throw error(404, err.message);
      }
      if (err.message.includes('access') || err.message.includes('permission')) {
        throw error(403, err.message);
      }
    }

    throw error(500, 'Failed to fetch product stats');
  }
};
