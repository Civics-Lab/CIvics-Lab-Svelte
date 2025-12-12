# Frontend API Migration Plan
## Connecting SvelteKit App to Standalone Hono.js API

**Date:** 2025-12-04
**Status:** Planning Phase
**Priority:** High - Authentication First

---

## Overview

This plan outlines the migration of the Civics Lab SvelteKit frontend from using internal SvelteKit API routes to consuming the new standalone Hono.js API (running on port 3000).

**Current State:**
- Frontend: SvelteKit app on port 5173
- Backend: Internal SvelteKit API routes (`/api/*`)
- Database: Shared PostgreSQL connection

**Target State:**
- Frontend: SvelteKit app on port 5173 (unchanged)
- Backend: Standalone Hono.js API on port 3000
- Communication: HTTP requests from SvelteKit → Hono API
- Database: Only Hono API connects to database

---

## Phase 1: Authentication Setup (Login & Signup)

### 1.1 Environment Configuration

**Files to Update:**
- `/Civics-Lab-Svelte/.env`

**Changes Needed:**
```env
# Add new variable for standalone API
VITE_API_BASE_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000

# Keep existing variables for backward compatibility during migration
API_BASE_URL=/api
JWT_SECRET=9ca038ad007a827307ed76da083d7174a2b823f4e4129a768962888164efe847
DATABASE_URL=postgresql://civics-lab_owner:npg_F1oqDpUtISr5@ep-wispy-haze-a53477sp-pooler.us-east-2.aws.neon.tech/civics-lab?sslmode=require

# Production API URL (for deployment)
VITE_PROD_API_URL=https://api.civicslab.net
```

**Rationale:**
- `VITE_` prefix makes variables available in browser
- Separate dev and prod API URLs for flexibility
- Keep old variables during migration for rollback capability

---

### 1.2 Create API Configuration Module

**New File:** `/Civics-Lab-Svelte/src/lib/config/api.ts`

```typescript
import { dev } from '$app/environment';

// Get API base URL from environment
const getApiBaseUrl = (): string => {
  // In development, use local API server
  if (dev) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  // In production, use production API URL
  return import.meta.env.VITE_PROD_API_URL || 'https://api.civicslab.net';
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

// API endpoint paths
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
  },
  contacts: {
    list: '/contacts',
    paginated: '/contacts/paginated',
    create: '/contacts',
    get: (id: string) => `/contacts/${id}`,
    update: (id: string) => `/contacts/${id}`,
    delete: (id: string) => `/contacts/${id}`,
  },
  businesses: {
    list: '/businesses',
    paginated: '/businesses/paginated',
    create: '/businesses',
    get: (id: string) => `/businesses/${id}`,
    update: (id: string) => `/businesses/${id}`,
    delete: (id: string) => `/businesses/${id}`,
  },
  donations: {
    list: '/donations',
    paginated: '/donations/paginated',
    create: '/donations',
    get: (id: string) => `/donations/${id}`,
    update: (id: string) => `/donations/${id}`,
    delete: (id: string) => `/donations/${id}`,
  },
} as const;
```

**Benefits:**
- Centralized API configuration
- Type-safe endpoint paths
- Easy environment switching
- Single source of truth for URLs

---

### 1.3 Create HTTP Client Utility

**New File:** `/Civics-Lab-Svelte/src/lib/utils/httpClient.ts`

```typescript
import { API_CONFIG } from '$lib/config/api';
import { browser } from '$app/environment';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  token?: string;
  params?: Record<string, string | number | boolean>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.defaultHeaders = API_CONFIG.headers;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = `${this.baseUrl}${endpoint}`;

    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });

    return `${url}?${searchParams.toString()}`;
  }

  /**
   * Build request headers
   */
  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...options.headers };

    // Add authorization header if token provided
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    } else if (browser) {
      // Try to get token from localStorage
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, params } = options;

    try {
      const url = this.buildUrl(endpoint, params);
      const headers = this.buildHeaders(options);

      const fetchOptions: RequestInit = {
        method,
        headers,
        credentials: 'include', // Include cookies
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('HTTP request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Convenience methods
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Export singleton instance
export const http = new HttpClient();
```

**Benefits:**
- Centralized error handling
- Automatic token injection
- Type-safe responses
- Query parameter building
- Cookie support

---

### 1.4 Update Auth Client Store

**File to Update:** `/Civics-Lab-Svelte/src/lib/auth/client.ts`

**Current Implementation:**
- Makes requests to `/api/auth/*` (internal SvelteKit routes)
- Uses relative paths

**Updated Implementation:**

```typescript
import { writable } from 'svelte/store';
import { http } from '$lib/utils/httpClient';
import { API_ENDPOINTS } from '$lib/config/api';
import { browser } from '$app/environment';

// ... existing interfaces (User, AuthState) ...

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null,
    loading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Login user with username/email and password
     */
    async login(username: string, password: string) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await http.post(API_ENDPOINTS.auth.login, {
          username,
          password
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Login failed');
        }

        const { token, user } = response.data.data || response.data;

        // Store token and user
        if (browser) {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));

          // Set cookie for server-side access
          document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
        }

        update(state => ({
          ...state,
          user,
          token,
          loading: false,
          error: null
        }));

        return { success: true, user, token };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Register new user
     */
    async signup(
      email: string,
      username: string,
      password: string,
      displayName: string,
      inviteToken?: string
    ) {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await http.post(API_ENDPOINTS.auth.signup, {
          email,
          username,
          password,
          displayName,
          inviteToken
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Signup failed');
        }

        const { token, user } = response.data.data || response.data;

        // Store token and user
        if (browser) {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));

          // Set cookie for server-side access
          document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
        }

        update(state => ({
          ...state,
          user,
          token,
          loading: false,
          error: null
        }));

        return { success: true, user, token };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Signup failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    /**
     * Validate token with server
     */
    async validateToken() {
      if (!browser) return { success: false, error: 'Not in browser' };

      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      try {
        const response = await http.post(API_ENDPOINTS.auth.validate, {}, { token });

        if (!response.success) {
          // Token invalid, clear auth data
          this.logout();
          return { success: false, error: 'Token invalid' };
        }

        return { success: true };
      } catch (error) {
        this.logout();
        return { success: false, error: 'Token validation failed' };
      }
    },

    /**
     * Logout user
     */
    logout() {
      if (browser) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        document.cookie = 'auth_token=; path=/; max-age=0';
      }

      set({
        user: null,
        token: null,
        loading: false,
        error: null
      });
    },

    /**
     * Set user and token manually
     */
    setUser(userData: User, token: string) {
      if (browser) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
      }

      update(state => ({
        ...state,
        user: userData,
        token,
        error: null
      }));
    }
  };
}

export const auth = createAuthStore();
```

**Key Changes:**
- Replace `fetch('/api/auth/...')` with `http.post(API_ENDPOINTS.auth.login)`
- Use centralized API configuration
- Maintain backward compatibility with existing UI components
- Keep same method signatures for zero breaking changes

---

### 1.5 Update Server-Side Auth Hook (Optional)

**File:** `/Civics-Lab-Svelte/src/hooks.server.ts`

**Current Implementation:**
- Verifies JWT tokens server-side
- Sets `event.locals.user`

**Decision Point:**

**Option A: Keep Server-Side Verification (Recommended)**
- Continue verifying tokens in SvelteKit hooks
- Makes requests to standalone API for validation
- Provides additional security layer

**Option B: Remove Server-Side Verification**
- Let standalone API handle all auth
- SvelteKit becomes pure client-side app
- Simpler but less secure

**Recommended: Option A with Proxy Pattern**

Update `authHandler` hook:

```typescript
// In hooks.server.ts
import { API_CONFIG, API_ENDPOINTS } from '$lib/config/api';

export const authHandler: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth_token') ||
                event.request.headers.get('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      // Validate token with standalone API
      const response = await fetch(`${API_CONFIG.baseUrl}${API_ENDPOINTS.auth.validate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        event.locals.user = data.user;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
    }
  }

  return resolve(event);
};
```

---

### 1.6 Update Login Page

**File:** `/Civics-Lab-Svelte/src/routes/login/+page.svelte`

**Current State:** Already using `auth.login()` from client store

**Changes Needed:** ✅ **NONE** - Page already uses auth store methods!

**Verification:**
```svelte
<script lang="ts">
  import { auth } from '$lib/auth/client';

  // This already works! Just need to update auth store implementation
  async function handleSubmit() {
    const result = await auth.login(email, password);
    if (result.success) {
      goto('/app');
    }
  }
</script>
```

✅ **No changes needed** - Login page already uses abstracted auth store

---

### 1.7 Update Signup Page

**File:** `/Civics-Lab-Svelte/src/routes/signup/+page.svelte`

**Current State:** Already using `auth.signup()` from client store

**Changes Needed:** ✅ **NONE** - Page already uses auth store methods!

**Verification:**
```svelte
<script lang="ts">
  import { auth } from '$lib/auth/client';

  // This already works! Just need to update auth store implementation
  async function handleSubmit() {
    const result = await auth.signup(email, username, password, displayName, inviteToken);
    if (result.success) {
      goto('/app');
    }
  }
</script>
```

✅ **No changes needed** - Signup page already uses abstracted auth store

---

## Phase 2: Testing & Validation

### 2.1 Manual Testing Checklist

**Login Flow:**
- [ ] Open http://localhost:5173/login
- [ ] Enter valid credentials
- [ ] Verify request goes to http://localhost:3000/auth/login
- [ ] Verify token stored in localStorage
- [ ] Verify cookie set
- [ ] Verify redirect to /app
- [ ] Verify protected routes work
- [ ] Test invalid credentials error handling

**Signup Flow:**
- [ ] Open http://localhost:5173/signup
- [ ] Fill registration form
- [ ] Verify request goes to http://localhost:3000/auth/signup
- [ ] Verify token stored in localStorage
- [ ] Verify cookie set
- [ ] Verify redirect to /app
- [ ] Test duplicate username error
- [ ] Test weak password error
- [ ] Test invite token acceptance

**Token Validation:**
- [ ] Refresh page after login
- [ ] Verify token still valid
- [ ] Close browser and reopen
- [ ] Verify persistent login works
- [ ] Test logout clears all data
- [ ] Test expired token handling

---

### 2.2 CORS Configuration

**Standalone API must allow requests from SvelteKit app:**

File: `civics-lab-api/src/middleware/cors.ts`

```typescript
export const corsMiddleware = cors({
  origin: [
    'http://localhost:5173',  // SvelteKit dev server
    'http://localhost:5174',  // Alternate port
    'https://civicslab.net',  // Production frontend
    'https://www.civicslab.net',
    'https://civics-lab.vercel.app'
  ],
  credentials: true,  // Allow cookies
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Authorization', 'Content-Type', 'X-Workspace-Id'],
});
```

✅ **Already configured** in standalone API

---

### 2.3 Error Scenarios to Test

1. **Network Errors:**
   - API server not running
   - Network timeout
   - DNS resolution failure

2. **Auth Errors:**
   - Invalid credentials
   - Expired token
   - Malformed token
   - Missing token

3. **Validation Errors:**
   - Weak password
   - Duplicate username/email
   - Missing required fields
   - Invalid email format

4. **Session Errors:**
   - Token expires mid-session
   - Multiple tabs/windows
   - Browser storage cleared

---

## Phase 3: Rollout Strategy

### 3.1 Feature Flag Approach

Create feature flag to toggle between old and new API:

```typescript
// src/lib/config/features.ts
export const FEATURES = {
  USE_STANDALONE_API: import.meta.env.VITE_USE_STANDALONE_API === 'true',
} as const;
```

In auth store:

```typescript
async login(username: string, password: string) {
  if (FEATURES.USE_STANDALONE_API) {
    // Use new standalone API
    return this.loginViaStandaloneApi(username, password);
  } else {
    // Use old SvelteKit API routes
    return this.loginViaInternalApi(username, password);
  }
}
```

### 3.2 Gradual Migration Steps

**Step 1: Setup (Week 1)**
- ✅ Create API config module
- ✅ Create HTTP client utility
- ✅ Update environment variables
- ✅ Configure CORS on API

**Step 2: Auth Migration (Week 1)**
- ✅ Update auth client store
- ✅ Update server hooks (optional)
- ✅ Test login flow
- ✅ Test signup flow
- ✅ Deploy to staging

**Step 3: Remaining Services (Week 2-3)**
- Migrate workspaces API calls
- Migrate contacts API calls
- Migrate businesses API calls
- Migrate donations API calls
- Test each service thoroughly

**Step 4: Production Deployment (Week 4)**
- Deploy standalone API to production
- Update frontend environment variables
- Monitor error rates
- Rollback capability ready

---

## Implementation Order

### Immediate (This Session)
1. ✅ Create `/src/lib/config/api.ts`
2. ✅ Create `/src/lib/utils/httpClient.ts`
3. ✅ Update `/src/lib/auth/client.ts`
4. ✅ Update `.env` with API URLs
5. ✅ Start both servers and test

### Next Session
1. Test authentication flow end-to-end
2. Fix any CORS issues
3. Handle error cases
4. Migrate workspace API calls
5. Update workspace-related pages

### Future Sessions
1. Migrate remaining services (contacts, businesses, donations)
2. Update all UI components
3. Remove old SvelteKit API routes
4. Remove database connection from SvelteKit
5. Production deployment

---

## Success Criteria

**Phase 1 Complete When:**
- [ ] Login works via standalone API
- [ ] Signup works via standalone API
- [ ] Token validation works
- [ ] Logout works
- [ ] Protected routes work
- [ ] No console errors
- [ ] Error messages display correctly
- [ ] Page transitions smooth
- [ ] Session persists across refresh
- [ ] Multiple tabs work correctly

---

## Rollback Plan

**If Issues Arise:**
1. Set `VITE_USE_STANDALONE_API=false` in `.env`
2. Restart SvelteKit dev server
3. App falls back to internal API routes
4. Debug standalone API issues
5. Re-enable when fixed

**Rollback Time:** < 1 minute (environment variable change)

---

## Notes & Considerations

**Benefits of This Approach:**
- Zero breaking changes to UI components
- Auth store API remains identical
- Easy rollback via feature flag
- Gradual migration possible
- Type safety maintained

**Risks & Mitigations:**
- **Risk:** CORS issues in production
  - **Mitigation:** Test with production domains early

- **Risk:** Cookie domain mismatch
  - **Mitigation:** Use same domain for API and frontend

- **Risk:** Network latency increases
  - **Mitigation:** Deploy API geographically close to frontend

- **Risk:** Token synchronization issues
  - **Mitigation:** Use localStorage + cookies redundantly

**Performance Considerations:**
- Additional network hop (SvelteKit → Hono API)
- Can be mitigated with:
  - HTTP/2
  - Connection pooling
  - Response caching
  - Geographic proximity

---

## Next Steps

1. **Review this plan** - Confirm approach
2. **Create API config files** - Setup infrastructure
3. **Update auth store** - Connect to standalone API
4. **Test thoroughly** - Verify all flows work
5. **Iterate** - Fix issues as they arise
6. **Expand** - Migrate remaining services

---

**Ready to implement Phase 1?** Let's start with creating the API configuration files!
