import { json, error } from '@sveltejs/kit';
import type { RequestHandler} from './$types';
import { productService } from '../../service';

// POST /api/products/:id/archive - Archive a product
export const POST: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Product ID is required');
  }

  try {
    const product = await productService.archiveProduct(id, user.id);
    return json({ product, success: true });
  } catch (err) {
    console.error('Error archiving product:', err);

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

    throw error(500, 'Failed to archive product');
  }
};
