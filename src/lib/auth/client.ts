import { writable, type Writable } from 'svelte/store';
import { http } from '$lib/utils/httpClient';
import { API_ENDPOINTS } from '$lib/config/api';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Create auth store
const createAuthStore = () => {
  // Initialize from localStorage if available
  let initialState: AuthStore = {
    user: null,
    token: null,
    loading: false,
    error: null
  };
  
  // Only run in browser context
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        initialState.token = storedToken;
        initialState.user = JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored auth data', error);
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }
  
  const store: Writable<AuthStore> = writable(initialState);
  const { subscribe, set, update } = store;
  
  // Auth methods
  return {
    subscribe,
    
    login: async (username: string, password: string) => {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        // Log the login attempt
        console.log(`Attempting to login with username: ${username}`);

        // Use the HTTP client to call the standalone API
        const response = await http.post(
          API_ENDPOINTS.auth.login,
          { username, password },
          { includeAuth: false } // Don't include auth token for login
        );

        if (!response.success) {
          throw new Error(response.error || 'Login failed');
        }

        const data = response.data;

        // Log successful data
        console.log('Login successful. User data received:',
          data.user ? JSON.stringify({
            id: data.user.id,
            username: data.user.username,
            role: data.user.role
          }) : 'No user data'
        );

        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));

            // Also set the token in cookie for server-side auth
            document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;

            console.log('Auth data saved to localStorage and cookie');
          } catch (e) {
            console.error('Failed to save auth data:', e);
          }
        }

        // Update store
        set({
          user: data.user,
          token: data.token,
          loading: false,
          error: null
        });

        console.log('Auth store updated, login complete');
        return data;
      } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        throw error;
      }
    },
    
    signup: async (email: string, username: string, password: string, displayName?: string, inviteToken?: string) => {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        // Use the HTTP client to call the standalone API
        const response = await http.post(
          API_ENDPOINTS.auth.signup,
          { email, username, password, displayName, inviteToken },
          { includeAuth: false } // Don't include auth token for signup
        );

        if (!response.success) {
          throw new Error(response.error || 'Signup failed');
        }

        const data = response.data;

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(data.user));

          // Also set the token in cookie for server-side auth
          document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
        }

        // Update store
        set({
          user: data.user,
          token: data.token,
          loading: false,
          error: null
        });

        // Return all data including invites and default workspace information
        return {
          ...data,
          defaultWorkspaceCreated: data.defaultWorkspaceCreated || false
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Signup failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        throw error;
      }
    },
    
    // Add a method to update user data and token without login
    setUser: (userData: User, token: string | null = null) => {
      // If a new token is provided, update it
      const newToken = token || get(store).token;
      
      // Update localStorage if available
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          // Update cookie
          document.cookie = `auth_token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
        }
      }
      
      // Update store
      update(state => ({
        ...state,
        user: userData,
        token: newToken || state.token
      }));
    },
    
    logout: () => {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        
        // Clear the cookie
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      
      // Reset store
      set({
        user: null,
        token: null,
        loading: false,
        error: null
      });
    },
    
    validateToken: async () => {
      const currentState = get(store);
      if (!currentState.token) {
        console.log('No token available to validate');
        return false;
      }

      try {
        console.log('Validating token with server...');

        // Use the HTTP client to call the standalone API
        const response = await http.post(
          API_ENDPOINTS.auth.validate,
          {},
          { includeAuth: true } // Include auth token for validation
        );

        if (!response.success) {
          console.error('Token validation failed:', response.error);

          // If token is expired or invalid, clear it
          if (response.error === 'Token expired' || response.error === 'Invalid token') {
            console.log('Clearing expired/invalid token from storage');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }

            // Reset the store
            set({
              user: null,
              token: null,
              loading: false,
              error: response.error
            });
          }

          return false;
        }

        console.log('Token validation succeeded');
        return response.success && response.data.valid;
      } catch (error) {
        console.error('Token validation error:', error);
        return false;
      }
    }
  };
};

// Export singleton instance
export const auth = createAuthStore();

// Helper function for get() - not available in svelte/store
function get(store: Writable<AuthStore>): AuthStore {
  let value: AuthStore;
  store.subscribe(v => value = v)();
  return value!;
}
