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
  workspaceId: string,
  token: string
): Promise<ActBlueConfig | null> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch ActBlue configuration');
  }

  const data = await response.json();
  return data.config;
}

/**
 * Create ActBlue configuration for a workspace
 */
export async function createActBlueConfig(
  workspaceId: string,
  configData: CreateActBlueConfigData,
  token: string
): Promise<ActBlueConfig> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(configData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create ActBlue configuration');
  }

  const data = await response.json();
  return data.config;
}

/**
 * Update ActBlue configuration for a workspace
 */
export async function updateActBlueConfig(
  workspaceId: string,
  configData: UpdateActBlueConfigData,
  token: string
): Promise<ActBlueConfig> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(configData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update ActBlue configuration');
  }

  const data = await response.json();
  return data.config;
}

/**
 * Delete ActBlue configuration for a workspace
 */
export async function deleteActBlueConfig(
  workspaceId: string,
  token: string
): Promise<void> {
  const response = await fetch(`/api/actblue/config?workspace_id=${workspaceId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete ActBlue configuration');
  }
}

/**
 * Test webhook credentials
 */
export async function testWebhookCredentials(
  workspaceId: string,
  password: string,
  token: string
): Promise<{ valid: boolean; message: string }> {
  const response = await fetch(`/api/actblue/config/test?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to test credentials');
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
  baseUrl: string,
  token: string
): Promise<string> {
  const response = await fetch(`/api/actblue/config/webhook-url?workspace_id=${workspaceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ baseUrl })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get webhook URL');
  }

  const data = await response.json();
  return data.webhookUrl;
}

/**
 * Utility: Check if ActBlue is configured for workspace
 */
export async function isActBlueConfigured(
  workspaceId: string,
  token: string
): Promise<boolean> {
  try {
    const config = await fetchActBlueConfig(workspaceId, token);
    return config !== null;
  } catch {
    return false;
  }
}

/**
 * Utility: Get ActBlue status for workspace
 */
export async function getActBlueStatus(
  workspaceId: string,
  token: string
): Promise<{
  configured: boolean;
  webhookEnabled: boolean;
  csvImportEnabled: boolean;
}> {
  try {
    const config = await fetchActBlueConfig(workspaceId, token);

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
