/**
 * Product type definitions
 */

export type ProductBillingPeriod = 'one_time' | 'weekly' | 'monthly' | 'yearly';

export interface Product {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  amount: number; // Amount in cents
  billingPeriod: ProductBillingPeriod;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
}

export interface CreateProductData {
  workspaceId: string;
  name: string;
  description?: string;
  amount: number;
  billingPeriod: ProductBillingPeriod;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  amount?: number;
  billingPeriod?: ProductBillingPeriod;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface ProductWithStats extends Product {
  activeSubscriptions: number;
  totalRevenue: number;
  totalSubscribers: number;
}
