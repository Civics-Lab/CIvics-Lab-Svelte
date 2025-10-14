/**
 * ActBlue Configuration Service
 * Manages ActBlue API credentials and webhook settings per workspace
 */

import { db } from '$lib/server/db';
import { actblueConfig, workspaces, userWorkspaces } from '$lib/db/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { ActBlueConfig, CreateActBlueConfigData, UpdateActBlueConfigData } from '$lib/types/actblue';

export class ActBlueConfigService {
  /**
   * Check if user has access to workspace
   */
  private async checkWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
    const userWorkspace = await db
      .select()
      .from(userWorkspaces)
      .where(
        and(
          eq(userWorkspaces.userId, userId),
          eq(userWorkspaces.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (userWorkspace.length === 0) {
      throw new Error('Access denied to this workspace');
    }
  }

  /**
   * Get ActBlue config for a workspace
   */
  async getConfig(workspaceId: string, userId: string): Promise<ActBlueConfig | null> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    const result = await db
      .select()
      .from(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const config = result[0];

    // Don't return the password hash to the client
    return {
      id: config.id,
      workspaceId: config.workspaceId,
      apiKey: config.apiKey || undefined,
      webhookUsername: config.webhookUsername,
      webhookPasswordHash: undefined, // Never return password hash
      isWebhookEnabled: config.isWebhookEnabled,
      isCsvImportEnabled: config.isCsvImportEnabled,
      metadata: config.metadata as Record<string, any> | undefined,
      createdAt: config.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: config.updatedAt?.toISOString() || new Date().toISOString()
    };
  }

  /**
   * Create or update ActBlue config for a workspace
   */
  async upsertConfig(
    workspaceId: string,
    userId: string,
    data: CreateActBlueConfigData | UpdateActBlueConfigData
  ): Promise<ActBlueConfig> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    // Check if config already exists
    const existing = await db
      .select()
      .from(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId))
      .limit(1);

    // Hash webhook password if provided
    let webhookPasswordHash: string | undefined;
    if ('webhookPassword' in data && data.webhookPassword) {
      webhookPasswordHash = await bcrypt.hash(data.webhookPassword, 10);
    }

    const configData = {
      workspaceId,
      apiKey: data.apiKey || null,
      webhookUsername: data.webhookUsername,
      webhookPasswordHash: webhookPasswordHash || (existing.length > 0 ? existing[0].webhookPasswordHash : null),
      isWebhookEnabled: data.isWebhookEnabled ?? true,
      isCsvImportEnabled: data.isCsvImportEnabled ?? false,
      metadata: data.metadata || {},
      updatedAt: new Date()
    };

    if (existing.length === 0) {
      // Create new config
      const { v4: uuidv4 } = await import('uuid');
      const newConfig = await db
        .insert(actblueConfig)
        .values({
          id: uuidv4(),
          ...configData,
          createdAt: new Date()
        })
        .returning();

      return {
        id: newConfig[0].id,
        workspaceId: newConfig[0].workspaceId,
        apiKey: newConfig[0].apiKey || undefined,
        webhookUsername: newConfig[0].webhookUsername,
        webhookPasswordHash: undefined,
        isWebhookEnabled: newConfig[0].isWebhookEnabled,
        isCsvImportEnabled: newConfig[0].isCsvImportEnabled,
        metadata: newConfig[0].metadata as Record<string, any> | undefined,
        createdAt: newConfig[0].createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: newConfig[0].updatedAt?.toISOString() || new Date().toISOString()
      };
    } else {
      // Update existing config
      const updated = await db
        .update(actblueConfig)
        .set(configData)
        .where(eq(actblueConfig.workspaceId, workspaceId))
        .returning();

      return {
        id: updated[0].id,
        workspaceId: updated[0].workspaceId,
        apiKey: updated[0].apiKey || undefined,
        webhookUsername: updated[0].webhookUsername,
        webhookPasswordHash: undefined,
        isWebhookEnabled: updated[0].isWebhookEnabled,
        isCsvImportEnabled: updated[0].isCsvImportEnabled,
        metadata: updated[0].metadata as Record<string, any> | undefined,
        createdAt: updated[0].createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: updated[0].updatedAt?.toISOString() || new Date().toISOString()
      };
    }
  }

  /**
   * Delete ActBlue config for a workspace
   */
  async deleteConfig(workspaceId: string, userId: string): Promise<void> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    await db
      .delete(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId));
  }

  /**
   * Test ActBlue webhook credentials
   * This validates that the username and password are set correctly
   */
  async testWebhookCredentials(
    workspaceId: string,
    userId: string,
    testPassword: string
  ): Promise<{ valid: boolean; message: string }> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    const config = await db
      .select()
      .from(actblueConfig)
      .where(eq(actblueConfig.workspaceId, workspaceId))
      .limit(1);

    if (config.length === 0) {
      return {
        valid: false,
        message: 'No ActBlue configuration found for this workspace'
      };
    }

    if (!config[0].webhookPasswordHash) {
      return {
        valid: false,
        message: 'Webhook password not set'
      };
    }

    const isValid = await bcrypt.compare(testPassword, config[0].webhookPasswordHash);

    return {
      valid: isValid,
      message: isValid ? 'Credentials are valid' : 'Invalid credentials'
    };
  }

  /**
   * Generate webhook URL for ActBlue configuration
   */
  async getWebhookUrl(workspaceId: string, userId: string, baseUrl: string): Promise<string> {
    await this.checkWorkspaceAccess(userId, workspaceId);

    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    return `${cleanBaseUrl}/api/actblue/webhook?workspace_id=${workspaceId}`;
  }
}

export const actblueConfigService = new ActBlueConfigService();
