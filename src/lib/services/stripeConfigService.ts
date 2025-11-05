/**
 * Stripe Config Service
 * Manages workspace-specific Stripe configurations
 */

import { db } from '$lib/server/db';
import { stripeConfig } from '$lib/db/drizzle/schema';
import { eq } from 'drizzle-orm';
import type { StripeConfig, CreateStripeConfigData, UpdateStripeConfigData, StripeConfigPublic } from '$lib/types/stripeConfig';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Get Stripe configuration for a workspace
 */
export async function getConfig(workspaceId: string): Promise<StripeConfig | null> {
  const result = await db
    .select()
    .from(stripeConfig)
    .where(eq(stripeConfig.workspaceId, workspaceId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const config = result[0];

  // Decrypt sensitive fields
  return {
    ...config,
    secretKey: decrypt(config.secretKey),
    webhookSecret: decrypt(config.webhookSecret)
  } as StripeConfig;
}

/**
 * Get public-safe Stripe config (no secrets)
 */
export async function getPublicConfig(workspaceId: string): Promise<StripeConfigPublic | null> {
  const config = await getConfig(workspaceId);

  if (!config) {
    return null;
  }

  return {
    id: config.id,
    workspaceId: config.workspaceId,
    publishableKey: config.publishableKey,
    hasSecretKey: !!config.secretKey,
    hasWebhookSecret: !!config.webhookSecret,
    platformFeePercentage: config.platformFeePercentage,
    isActive: config.isActive,
    webhookUrl: `${process.env.PUBLIC_URL || 'http://localhost:5173'}/api/stripe/webhook`
  };
}

/**
 * Create Stripe configuration for a workspace
 */
export async function createConfig(data: CreateStripeConfigData): Promise<StripeConfig> {
  // Encrypt sensitive fields
  const encryptedSecretKey = encrypt(data.secretKey);
  const encryptedWebhookSecret = encrypt(data.webhookSecret);

  const result = await db
    .insert(stripeConfig)
    .values({
      workspaceId: data.workspaceId,
      publishableKey: data.publishableKey,
      secretKey: encryptedSecretKey,
      webhookSecret: encryptedWebhookSecret,
      platformFeePercentage: data.platformFeePercentage || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  const config = result[0];

  return {
    ...config,
    secretKey: data.secretKey,
    webhookSecret: data.webhookSecret
  } as StripeConfig;
}

/**
 * Update Stripe configuration
 */
export async function updateConfig(
  workspaceId: string,
  data: UpdateStripeConfigData
): Promise<StripeConfig> {
  const updates: any = {
    updatedAt: new Date()
  };

  if (data.publishableKey !== undefined) {
    updates.publishableKey = data.publishableKey;
  }

  if (data.secretKey !== undefined) {
    updates.secretKey = encrypt(data.secretKey);
  }

  if (data.webhookSecret !== undefined) {
    updates.webhookSecret = encrypt(data.webhookSecret);
  }

  if (data.platformFeePercentage !== undefined) {
    updates.platformFeePercentage = data.platformFeePercentage;
  }

  if (data.isActive !== undefined) {
    updates.isActive = data.isActive;
  }

  const result = await db
    .update(stripeConfig)
    .set(updates)
    .where(eq(stripeConfig.workspaceId, workspaceId))
    .returning();

  const config = result[0];

  // Decrypt for return
  return {
    ...config,
    secretKey: decrypt(config.secretKey),
    webhookSecret: decrypt(config.webhookSecret)
  } as StripeConfig;
}

/**
 * Test Stripe connection
 */
export async function testConnection(workspaceId: string): Promise<boolean> {
  try {
    const config = await getConfig(workspaceId);

    if (!config) {
      return false;
    }

    // Import Stripe dynamically to test connection
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2024-11-20.acacia'
    });

    // Try to retrieve account details
    await stripe.accounts.retrieve();

    return true;
  } catch (error) {
    console.error('Stripe connection test failed:', error);
    return false;
  }
}

/**
 * Delete Stripe configuration
 */
export async function deleteConfig(workspaceId: string): Promise<void> {
  await db
    .delete(stripeConfig)
    .where(eq(stripeConfig.workspaceId, workspaceId));
}

/**
 * Check if workspace has Stripe configured
 */
export async function hasStripeConfig(workspaceId: string): Promise<boolean> {
  const config = await getConfig(workspaceId);
  return config !== null && config.isActive;
}
