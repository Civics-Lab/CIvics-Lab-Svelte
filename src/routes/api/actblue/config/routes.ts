/**
 * ActBlue Configuration API Routes
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { actblueConfigService } from './service';
import { verifyJWT } from '$lib/auth/jwt';

// Zod schemas for validation
const createConfigSchema = z.object({
  apiKey: z.string().optional(),
  webhookUsername: z.string().min(1, 'Webhook username is required'),
  webhookPassword: z.string().min(8, 'Webhook password must be at least 8 characters'),
  isWebhookEnabled: z.boolean().optional(),
  isCsvImportEnabled: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

const updateConfigSchema = z.object({
  apiKey: z.string().optional(),
  webhookUsername: z.string().min(1).optional(),
  webhookPassword: z.string().min(8).optional(),
  isWebhookEnabled: z.boolean().optional(),
  isCsvImportEnabled: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

const testCredentialsSchema = z.object({
  password: z.string().min(1, 'Password is required')
});

const webhookUrlSchema = z.object({
  baseUrl: z.string().url('Valid base URL is required')
});

export const actblueConfigRouter = new Hono()
  /**
   * GET /api/actblue/config?workspace_id=<id>
   * Get ActBlue configuration for a workspace
   */
  .get('/', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const config = await actblueConfigService.getConfig(
        workspaceId,
        payload.userId as string
      );

      return c.json({ config, success: true });
    } catch (err) {
      console.error('Error fetching ActBlue config:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to fetch ActBlue config',
          success: false
        },
        500
      );
    }
  })

  /**
   * POST /api/actblue/config?workspace_id=<id>
   * Create or update ActBlue configuration
   */
  .post('/', zValidator('json', createConfigSchema), async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const data = c.req.valid('json');

      const config = await actblueConfigService.upsertConfig(
        workspaceId,
        payload.userId as string,
        data
      );

      return c.json({ config, success: true });
    } catch (err) {
      console.error('Error creating ActBlue config:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to create ActBlue config',
          success: false
        },
        500
      );
    }
  })

  /**
   * PUT /api/actblue/config?workspace_id=<id>
   * Update ActBlue configuration
   */
  .put('/', zValidator('json', updateConfigSchema), async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const data = c.req.valid('json');

      const config = await actblueConfigService.upsertConfig(
        workspaceId,
        payload.userId as string,
        data
      );

      return c.json({ config, success: true });
    } catch (err) {
      console.error('Error updating ActBlue config:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to update ActBlue config',
          success: false
        },
        500
      );
    }
  })

  /**
   * DELETE /api/actblue/config?workspace_id=<id>
   * Delete ActBlue configuration
   */
  .delete('/', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      await actblueConfigService.deleteConfig(
        workspaceId,
        payload.userId as string
      );

      return c.json({ success: true, message: 'ActBlue configuration deleted' });
    } catch (err) {
      console.error('Error deleting ActBlue config:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to delete ActBlue config',
          success: false
        },
        500
      );
    }
  })

  /**
   * POST /api/actblue/config/test?workspace_id=<id>
   * Test webhook credentials
   */
  .post('/test', zValidator('json', testCredentialsSchema), async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const { password } = c.req.valid('json');

      const result = await actblueConfigService.testWebhookCredentials(
        workspaceId,
        payload.userId as string,
        password
      );

      return c.json({ ...result, success: true });
    } catch (err) {
      console.error('Error testing credentials:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to test credentials',
          success: false
        },
        500
      );
    }
  })

  /**
   * POST /api/actblue/config/webhook-url?workspace_id=<id>
   * Get webhook URL for ActBlue configuration
   */
  .post('/webhook-url', zValidator('json', webhookUrlSchema), async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Authorization header required' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyJWT(token);

      if (!payload || !payload.userId) {
        return c.json({ error: 'Invalid token' }, 401);
      }

      const workspaceId = c.req.query('workspace_id');
      if (!workspaceId) {
        return c.json({ error: 'workspace_id is required' }, 400);
      }

      const { baseUrl } = c.req.valid('json');

      const webhookUrl = await actblueConfigService.getWebhookUrl(
        workspaceId,
        payload.userId as string,
        baseUrl
      );

      return c.json({ webhookUrl, success: true });
    } catch (err) {
      console.error('Error generating webhook URL:', err);
      return c.json(
        {
          error: err instanceof Error ? err.message : 'Failed to generate webhook URL',
          success: false
        },
        500
      );
    }
  });
