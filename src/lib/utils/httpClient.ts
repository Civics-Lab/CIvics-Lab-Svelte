/**
 * HTTP Client Utility
 * Centralized HTTP client for making API calls to the standalone Hono.js API
 */

import { API_CONFIG } from '$lib/config/api';
import { browser } from '$app/environment';

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Request options
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  includeAuth?: boolean;
  timeout?: number;
}

/**
 * HTTP Client Class
 */
class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.defaultHeaders = API_CONFIG.headers;
    this.defaultTimeout = API_CONFIG.timeout;
  }

  /**
   * Get the auth token from localStorage
   */
  private getAuthToken(): string | null {
    if (!browser) return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Build request headers with optional auth token
   */
  private buildHeaders(options: RequestOptions): HeadersInit {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Auto-inject auth token if includeAuth is true (default)
    if (options.includeAuth !== false) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Main request method
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      params,
      timeout = this.defaultTimeout,
    } = options;

    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(options);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`[HTTP Client] ${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'include', // Include cookies for session management
      });

      clearTimeout(timeoutId);

      // Get response text first for debugging
      const responseText = await response.text();

      // Parse JSON response
      let data: ApiResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[HTTP Client] Failed to parse JSON response:', e);
        console.error('[HTTP Client] Raw response:', responseText);
        throw new Error('Invalid response from server');
      }

      // Check if request was successful
      if (!response.ok || !data.success) {
        console.error('[HTTP Client] Request failed:', data.error || `HTTP ${response.status}`);
        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
        };
      }

      console.log('[HTTP Client] Request successful');
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('[HTTP Client] Request timeout');
          return {
            success: false,
            error: 'Request timeout',
          };
        }

        console.error('[HTTP Client] Request error:', error.message);
        return {
          success: false,
          error: error.message,
        };
      }

      console.error('[HTTP Client] Unknown error:', error);
      return {
        success: false,
        error: 'An unknown error occurred',
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options: Omit<RequestOptions, 'method' | 'body' | 'params'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      params,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<RequestOptions, 'method' | 'body'> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  }
}

// Export singleton instance
export const http = new HttpClient();
