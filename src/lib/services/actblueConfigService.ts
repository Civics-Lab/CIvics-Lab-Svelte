/**
 * ActBlue Configuration Service (Client-side)
 * Manages ActBlue API credentials and webhook settings
 */

import type {
  ActBlueConfig,
  CreateActBlueConfigData,
  UpdateActBlueConfigData
} from '$lib/types/actblue';

/**
 * Get ActBlue configuration for a workspace
 */
export async function fetchActBlueConfig(
  workspaceId: string
): Promise<ActBlueConfig | null> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch ActBlue configuration');
    } catch (jsonError) {
      throw new Error(`Failed to fetch ActBlue configuration: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data.config;
}

/**
 * Create ActBlue configuration for a workspace
 */
export async function createActBlueConfig(
  workspaceId: string,
  configData: CreateActBlueConfigData
): Promise<ActBlueConfig> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(configData)
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create ActBlue configuration');
    } catch (jsonError) {
      throw new Error(`Failed to create ActBlue configuration: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data.config;
}

/**
 * Update ActBlue configuration for a workspace
 */
export async function updateActBlueConfig(
  workspaceId: string,
  configData: UpdateActBlueConfigData
): Promise<ActBlueConfig> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(configData)
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update ActBlue configuration');
    } catch (jsonError) {
      throw new Error(`Failed to update ActBlue configuration: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data.config;
}

/**
 * Delete ActBlue configuration for a workspace
 */
export async function deleteActBlueConfig(
  workspaceId: string
): Promise<void> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete ActBlue configuration');
    } catch (jsonError) {
      throw new Error(`Failed to delete ActBlue configuration: ${response.status} ${response.statusText}`);
    }
  }
}

/**
 * Test webhook credentials
 */
export async function testWebhookCredentials(
  workspaceId: string,
  password: string
): Promise<{ valid: boolean; message: string }> {
  const response = await fetch(`/api/actblue/config/test?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to test credentials');
    } catch (jsonError) {
      throw new Error(`Failed to test credentials: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return {
    valid: data.valid,
    message: data.message
  };
}

/**
 * Get webhook URL for ActBlue configuration
 */
export async function getWebhookUrl(
  workspaceId: string,
  baseUrl: string
): Promise<string> {
  const response = await fetch(`/api/actblue/config/webhook-url?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ baseUrl })
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get webhook URL');
    } catch (jsonError) {
      throw new Error(`Failed to get webhook URL: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data.webhookUrl;
}

/**
 * Utility: Check if ActBlue is configured for workspace
 */
export async function isActBlueConfigured(
  workspaceId: string
): Promise<boolean> {
  try {
    const config = await fetchActBlueConfig(workspaceId);
    return config !== null;
  } catch {
    return false;
  }
}

/**
 * Utility: Get ActBlue status for workspace
 */
export async function getActBlueStatus(
  workspaceId: string
): Promise<{
  configured: boolean;
  webhookEnabled: boolean;
  csvImportEnabled: boolean;
}> {
  try {
    const config = await fetchActBlueConfig(workspaceId);

    if (!config) {
      return {
        configured: false,
        webhookEnabled: false,
        csvImportEnabled: false
      };
    }

    return {
      configured: true,
      webhookEnabled: config.isWebhookEnabled,
      csvImportEnabled: config.isCsvImportEnabled
    };
  } catch {
    return {
      configured: false,
      webhookEnabled: false,
      csvImportEnabled: false
    };
  }
}
