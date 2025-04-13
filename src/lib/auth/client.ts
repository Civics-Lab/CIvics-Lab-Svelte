import { writable, type Writable } from 'svelte/store';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
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
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Login failed');
        }
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.data.token);
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
          
          // Also set the token in cookie for server-side auth
          document.cookie = `auth_token=${data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
        }
        
        // Update store
        set({
          user: data.data.user,
          token: data.data.token,
          loading: false,
          error: null
        });
        
        return data.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Login failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        throw error;
      }
    },
    
    signup: async (email: string, username: string, password: string, displayName?: string, inviteToken?: string) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, username, password, displayName, inviteToken })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Signup failed');
        }
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.data.token);
          localStorage.setItem('auth_user', JSON.stringify(data.data.user));
          
          // Also set the token in cookie for server-side auth
          document.cookie = `auth_token=${data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
        }
        
        // Update store
        set({
          user: data.data.user,
          token: data.data.token,
          loading: false,
          error: null
        });
        
        // Return all data including invites information
        return data.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Signup failed';
        update(state => ({ ...state, loading: false, error: errorMessage }));
        throw error;
      }
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
      if (!currentState.token) return false;
      
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentState.token}`
          }
        });
        
        const data = await response.json();
        return data.success && data.data.valid;
      } catch (error) {
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
