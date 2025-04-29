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
        // Log the login attempt
        console.log(`Attempting to login with username: ${username}`);
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });
        
        // Check if the request was successful
        console.log(`Login response status: ${response.status}`);
        
        // Get the response text first for debugging
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // Parse the JSON (if it's valid JSON)
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          throw new Error('Invalid response from server');
        }
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Login failed');
        }
        
        // Log successful data
        console.log('Login successful. User data received:', 
          data.data.user ? JSON.stringify({
            id: data.data.user.id,
            username: data.data.user.username,
            role: data.data.user.role
          }) : 'No user data'
        );
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('auth_token', data.data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.data.user));
            
            // Also set the token in cookie for server-side auth
            document.cookie = `auth_token=${data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
            
            console.log('Auth data saved to localStorage and cookie');
          } catch (e) {
            console.error('Failed to save auth data:', e);
          }
        }
        
        // Update store
        set({
          user: data.data.user,
          token: data.data.token,
          loading: false,
          error: null
        });
        
        console.log('Auth store updated, login complete');
        return data.data;
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
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, username, password, displayName, inviteToken })
        });
        
        // Get the response text first for debugging
        const responseText = await response.text();
        console.log('Raw signup response:', responseText);
        
        // Parse the JSON (if it's valid JSON)
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON response for signup:', e);
          throw new Error('Invalid response from server');
        }
        
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
        
        // Return all data including invites and default workspace information
        return {
          ...data.data,
          defaultWorkspaceCreated: data.data.defaultWorkspaceCreated || false
        };
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
      if (!currentState.token) {
        console.log('No token available to validate');
        return false;
      }
      
      try {
        console.log('Validating token with server...');
        const response = await fetch('/api/auth/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentState.token}`
          }
        });
        
        // Get response text first for debugging
        const responseText = await response.text();
        console.log('Validation response:', responseText);
        
        // Parse the JSON
        const data = JSON.parse(responseText);
        
        if (!data.success) {
          console.error('Token validation failed:', data.error);
          
          // If token is expired or invalid, clear it
          if (data.error === 'Token expired' || data.error === 'Invalid token') {
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
              error: data.error
            });
          }
          
          return false;
        }
        
        console.log('Token validation succeeded');
        return data.success && data.data.valid;
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
