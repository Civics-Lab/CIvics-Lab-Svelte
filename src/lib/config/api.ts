/**
 * API Configuration
 * Central configuration for connecting to the standalone Hono.js API
 */

import { browser } from '$app/environment';

/**
 * Get the API base URL based on environment
 */
export function getApiBaseUrl(): string {
  // In browser context, check for environment variable
  if (browser && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Default to localhost in development
  return 'http://localhost:3000';
}

/**
 * API Configuration
 */
export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * API Endpoints
 * Centralized endpoint paths for type-safe API calls
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    validate: '/auth/validate',
    changePassword: '/auth/change-password',
    updateProfile: '/auth/update-profile',
    updateEmail: '/auth/update-email',
    uploadAvatar: '/auth/upload-avatar',
    logout: '/auth/logout',
  },
  workspaces: {
    list: '/workspaces',
    create: '/workspaces',
    get: (id: string) => `/workspaces/${id}`,
    update: (id: string) => `/workspaces/${id}`,
    delete: (id: string) => `/workspaces/${id}`,
    members: (id: string) => `/workspaces/${id}/members`,
    addMember: (id: string) => `/workspaces/${id}/members`,
    updateMember: (workspaceId: string, userId: string) => `/workspaces/${workspaceId}/members/${userId}`,
    removeMember: (workspaceId: string, userId: string) => `/workspaces/${workspaceId}/members/${userId}`,
    uploadLogo: (id: string) => `/workspaces/${id}/upload-logo`,
    paginated: '/workspaces/paginated',
  },
  contacts: {
    list: '/contacts',
    create: '/contacts',
    get: (id: string) => `/contacts/${id}`,
    update: (id: string) => `/contacts/${id}`,
    delete: (id: string) => `/contacts/${id}`,
    paginated: '/contacts/paginated',
  },
  businesses: {
    list: '/businesses',
    create: '/businesses',
    get: (id: string) => `/businesses/${id}`,
    update: (id: string) => `/businesses/${id}`,
    delete: (id: string) => `/businesses/${id}`,
    paginated: '/businesses/paginated',
  },
  donations: {
    list: '/donations',
    create: '/donations',
    get: (id: string) => `/donations/${id}`,
    update: (id: string) => `/donations/${id}`,
    delete: (id: string) => `/donations/${id}`,
    paginated: '/donations/paginated',
  },
};
