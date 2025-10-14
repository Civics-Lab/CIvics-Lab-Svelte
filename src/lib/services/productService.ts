/**
 * Product Service
 * Handles business logic for donation products/tiers
 */

import type { Product, CreateProductData, UpdateProductData, ProductWithStats } from '$lib/types/product';

/**
 * Fetch all products for a workspace
 */
export async function fetchProducts(workspaceId: string): Promise<Product[]> {
  try {
    const response = await fetch(`/api/products?workspace_id=${workspaceId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch products');
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error in fetchProducts:', error);
    throw error;
  }
}

/**
 * Fetch only active products for a workspace
 */
export async function fetchActiveProducts(workspaceId: string): Promise<Product[]> {
  try {
    const response = await fetch(`/api/products?workspace_id=${workspaceId}&active_only=true`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch active products');
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error in fetchActiveProducts:', error);
    throw error;
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProduct(productId: string): Promise<Product> {
  try {
    const response = await fetch(`/api/products/${productId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch product');
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error in fetchProduct:', error);
    throw error;
  }
}

/**
 * Fetch product with statistics
 */
export async function fetchProductWithStats(productId: string): Promise<ProductWithStats> {
  try {
    const response = await fetch(`/api/products/${productId}/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch product stats');
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error in fetchProductWithStats:', error);
    throw error;
  }
}

/**
 * Create a new product
 */
export async function createProduct(productData: CreateProductData): Promise<Product> {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error in createProduct:', error);
    throw error;
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, updateData: UpdateProductData): Promise<Product> {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error in updateProduct:', error);
    throw error;
  }
}

/**
 * Archive a product (soft delete - sets isActive to false)
 */
export async function archiveProduct(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/products/${productId}/archive`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to archive product');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in archiveProduct:', error);
    throw error;
  }
}

/**
 * Delete a product (hard delete)
 */
export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    throw error;
  }
}

/**
 * Format amount from cents to dollars
 */
export function formatProductAmount(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amountInCents / 100);
}

/**
 * Format billing period for display
 */
export function formatBillingPeriod(period: string): string {
  const periodMap: Record<string, string> = {
    'one_time': 'One-time',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'yearly': 'Yearly'
  };
  return periodMap[period] || period;
}
