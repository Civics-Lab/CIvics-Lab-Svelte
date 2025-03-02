// src/lib/stores/userStore.ts
import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Initialize the user store with default values
const initialState: UserState = {
  user: null,
  isLoading: true,
  error: null
};

function createUserStore() {
  const { subscribe, set, update } = writable<UserState>(initialState);

  return {
    subscribe,
    
    // Set the user data
    setUser: (user: User | null) => {
      update(state => ({
        ...state,
        user,
        isLoading: false
      }));
    },
    
    // Update loading state
    setLoading: (isLoading: boolean) => {
      update(state => ({ ...state, isLoading }));
    },
    
    // Update error state
    setError: (error: string | null) => {
      update(state => ({ ...state, error }));
    },
    
    // Reset the store to its initial state
    reset: () => {
      set(initialState);
    }
  };
}

export const userStore = createUserStore();