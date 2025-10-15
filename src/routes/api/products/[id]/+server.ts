import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { productService } from '../service';

// GET /api/products/:id - Get specific product
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
    const product = await productService.getProductById(id, user.id);
    return json({ product });
  } catch (err) {
    console.error('Error fetching product:', err);

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

    throw error(500, 'Failed to fetch product');
  }
};

// PUT /api/products/:id - Update product
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Product ID is required');
  }

  const updateData = await request.json();

  try {
    const product = await productService.updateProduct(id, updateData, user.id);
    return json({ product });
  } catch (err) {
    console.error('Error updating product:', err);

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
      if (err.message.includes('Invalid') || err.message.includes('required')) {
        throw error(400, err.message);
      }
    }

    throw error(500, 'Failed to update product');
  }
};

// DELETE /api/products/:id - Delete product
export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;

  if (!user) {
    throw error(401, 'Authentication required');
  }

  const { id } = params;

  if (!id) {
    throw error(400, 'Product ID is required');
  }

  try {
    const result = await productService.deleteProduct(id, user.id);
    return json(result);
  } catch (err) {
    console.error('Error deleting product:', err);

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
      if (err.message.includes('Cannot delete')) {
        throw error(400, err.message);
      }
    }

    throw error(500, 'Failed to delete product');
  }
};
