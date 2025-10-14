import { db } from '$lib/server/db';
import { products, subscriptions, donations, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { verifyWorkspaceAccess } from '$lib/server/auth';
import { v4 as uuidv4 } from 'uuid';

export const productService = {
  /**
   * Get all products for a workspace
   */
  async getProducts(workspaceId: string, userId: string, activeOnly: boolean = false) {
    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    // Build query
    let query = db
      .select()
      .from(products)
      .where(eq(products.workspaceId, workspaceId));

    // Filter by active status if requested
    if (activeOnly) {
      query = query.where(and(
        eq(products.workspaceId, workspaceId),
        eq(products.isActive, true)
      ));
    }

    // Order by creation date
    query = query.orderBy(desc(products.createdAt));

    const productResults = await query;

    return { products: productResults };
  },

  /**
   * Get a single product by ID
   */
  async getProductById(productId: string, userId: string) {
    // Get product
    const product = await this.checkProductAccess(userId, productId);

    return product;
  },

  /**
   * Get product with statistics
   */
  async getProductWithStats(productId: string, userId: string) {
    // Get product and verify access
    const product = await this.checkProductAccess(userId, productId);

    // Get active subscriptions count
    const activeSubscriptionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.productId, productId),
        eq(subscriptions.status, 'active')
      ));

    const activeSubscriptionsCount = activeSubscriptionsResult[0]?.count || 0;

    // Get total subscribers (all time)
    const totalSubscribersResult = await db
      .select({ count: sql<number>`count(distinct ${subscriptions.contactId})` })
      .from(subscriptions)
      .where(eq(subscriptions.productId, productId));

    const totalSubscribers = totalSubscribersResult[0]?.count || 0;

    // Get total revenue from donations linked to this product
    const totalRevenueResult = await db
      .select({ sum: sql<number>`coalesce(sum(${donations.amount}), 0)` })
      .from(donations)
      .where(eq(donations.productId, productId));

    const totalRevenue = totalRevenueResult[0]?.sum || 0;

    return {
      ...product,
      activeSubscriptions: activeSubscriptionsCount,
      totalSubscribers,
      totalRevenue
    };
  },

  /**
   * Create a new product
   */
  async createProduct(data: any, userId: string) {
    // Validate required fields
    if (!data.workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!data.name || data.name.trim() === '') {
      throw new Error('Product name is required');
    }

    if (!data.amount || isNaN(Number(data.amount))) {
      throw new Error('Valid amount is required');
    }

    if (!data.billingPeriod) {
      throw new Error('Billing period is required');
    }

    // Verify workspace access
    const { hasAccess } = await verifyWorkspaceAccess(data.workspaceId, userId);
    if (!hasAccess) {
      throw new Error('You do not have permission to access this workspace');
    }

    // Validate billing period
    const validBillingPeriods = ['one_time', 'weekly', 'monthly', 'yearly'];
    if (!validBillingPeriods.includes(data.billingPeriod)) {
      throw new Error('Invalid billing period');
    }

    // Prepare data for insertion
    const newProduct = {
      id: uuidv4(),
      workspaceId: data.workspaceId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      amount: Number(data.amount),
      billingPeriod: data.billingPeriod,
      isActive: data.isActive !== undefined ? data.isActive : true,
      metadata: data.metadata || null,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the product
    const [createdProduct] = await db
      .insert(products)
      .values(newProduct)
      .returning();

    return createdProduct;
  },

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, data: any, userId: string) {
    // Check access and get product
    const product = await this.checkProductAccess(userId, productId);

    // Build update fields
    const updateFields: any = {};

    if (data.name !== undefined && data.name.trim() !== '') {
      updateFields.name = data.name.trim();
    }

    if (data.description !== undefined) {
      updateFields.description = data.description?.trim() || null;
    }

    if (data.amount !== undefined && !isNaN(Number(data.amount))) {
      updateFields.amount = Number(data.amount);
    }

    if (data.billingPeriod !== undefined) {
      const validBillingPeriods = ['one_time', 'weekly', 'monthly', 'yearly'];
      if (!validBillingPeriods.includes(data.billingPeriod)) {
        throw new Error('Invalid billing period');
      }
      updateFields.billingPeriod = data.billingPeriod;
    }

    if (data.isActive !== undefined) {
      updateFields.isActive = data.isActive;
    }

    if (data.metadata !== undefined) {
      updateFields.metadata = data.metadata;
    }

    // Only update if there's data to update
    if (Object.keys(updateFields).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Set updated timestamp
    updateFields.updatedAt = new Date();

    // Update the product
    const [updatedProduct] = await db
      .update(products)
      .set(updateFields)
      .where(eq(products.id, productId))
      .returning();

    return updatedProduct;
  },

  /**
   * Archive a product (soft delete)
   */
  async archiveProduct(productId: string, userId: string) {
    // Check access
    await this.checkProductAccess(userId, productId);

    // Update to set isActive to false
    const [archivedProduct] = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId))
      .returning();

    return archivedProduct;
  },

  /**
   * Delete a product (hard delete)
   */
  async deleteProduct(productId: string, userId: string) {
    // Check access
    await this.checkProductAccess(userId, productId);

    // Check if product has active subscriptions
    const activeSubscriptionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.productId, productId),
        eq(subscriptions.status, 'active')
      ));

    const activeSubscriptionsCount = activeSubscriptionsResult[0]?.count || 0;

    if (activeSubscriptionsCount > 0) {
      throw new Error('Cannot delete product with active subscriptions. Please archive it instead.');
    }

    // Delete the product
    await db
      .delete(products)
      .where(eq(products.id, productId));

    return { success: true };
  },

  /**
   * Helper function to check access to product
   */
  async checkProductAccess(userId: string, productId: string) {
    // Get product
    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!productResult || productResult.length === 0) {
      throw new Error('Product not found');
    }

    const product = productResult[0];

    // Check user access to workspace
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, userId),
          eq(userWorkspaces.workspaceId, product.workspaceId)
        )
      )
      .limit(1);

    if (!userWorkspace || userWorkspace.length === 0) {
      throw new Error('You do not have access to this product');
    }

    return product;
  }
};
