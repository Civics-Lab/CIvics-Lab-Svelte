// src/lib/stores/paginationStore.ts
import { writable, derived, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  offset: number;
}

export interface PaginationStore extends Writable<PaginationState> {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalRecords: (total: number) => void;
  reset: () => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
}

// Default page sizes for different data types
export const DEFAULT_PAGE_SIZES = {
  contacts: 250,
  businesses: 100,
  donations: 500,
  default: 100
} as const;

export function createPaginationStore(
  storageKey: string,
  defaultPageSize: number = DEFAULT_PAGE_SIZES.default
): PaginationStore {
  // Load initial state from localStorage if available
  const getInitialState = (): PaginationState => {
    if (browser) {
      try {
        const stored = localStorage.getItem(`pagination-${storageKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            currentPage: 1, // Always start on page 1
            pageSize: parsed.pageSize || defaultPageSize,
            totalRecords: 0,
            totalPages: 0,
            offset: 0
          };
        }
      } catch (error) {
        console.warn('Failed to load pagination state from localStorage:', error);
      }
    }
    
    return {
      currentPage: 1,
      pageSize: defaultPageSize,
      totalRecords: 0,
      totalPages: 0,
      offset: 0
    };
  };

  const initialState = getInitialState();
  const { subscribe, set, update } = writable<PaginationState>(initialState);

  // Save to localStorage whenever state changes
  const saveToStorage = (state: PaginationState) => {
    if (browser) {
      try {
        localStorage.setItem(`pagination-${storageKey}`, JSON.stringify({
          pageSize: state.pageSize
        }));
      } catch (error) {
        console.warn('Failed to save pagination state to localStorage:', error);
      }
    }
  };

  // Calculate derived values
  const calculateDerived = (state: PaginationState): PaginationState => {
    const totalPages = Math.ceil(state.totalRecords / state.pageSize);
    const validPage = Math.max(1, Math.min(state.currentPage, totalPages || 1));
    const offset = (validPage - 1) * state.pageSize;

    return {
      ...state,
      currentPage: validPage,
      totalPages: totalPages || 0,
      offset
    };
  };

  const setPage = (page: number) => {
    update(state => {
      const newState = calculateDerived({ ...state, currentPage: Math.max(1, page) });
      return newState;
    });
  };

  const setPageSize = (size: number) => {
    update(state => {
      const newState = calculateDerived({ 
        ...state, 
        pageSize: Math.max(1, size),
        currentPage: 1 // Reset to first page when changing page size
      });
      saveToStorage(newState);
      return newState;
    });
  };

  const setTotalRecords = (total: number) => {
    update(state => {
      const newState = calculateDerived({ ...state, totalRecords: Math.max(0, total) });
      return newState;
    });
  };

  const reset = () => {
    const newState = calculateDerived({
      currentPage: 1,
      pageSize: defaultPageSize,
      totalRecords: 0,
      totalPages: 0,
      offset: 0
    });
    set(newState);
    saveToStorage(newState);
  };

  const nextPage = () => {
    update(state => {
      if (state.currentPage < state.totalPages) {
        return calculateDerived({ ...state, currentPage: state.currentPage + 1 });
      }
      return state;
    });
  };

  const previousPage = () => {
    update(state => {
      if (state.currentPage > 1) {
        return calculateDerived({ ...state, currentPage: state.currentPage - 1 });
      }
      return state;
    });
  };

  const firstPage = () => {
    setPage(1);
  };

  const lastPage = () => {
    update(state => {
      return calculateDerived({ ...state, currentPage: state.totalPages });
    });
  };

  // Initialize with calculated values
  update(state => calculateDerived(state));

  return {
    subscribe,
    set,
    update,
    setPage,
    setPageSize,
    setTotalRecords,
    reset,
    nextPage,
    previousPage,
    firstPage,
    lastPage
  };
}

// Convenience stores for each data type
export const contactsPagination = createPaginationStore('contacts', DEFAULT_PAGE_SIZES.contacts);
export const businessesPagination = createPaginationStore('businesses', DEFAULT_PAGE_SIZES.businesses);
export const donationsPagination = createPaginationStore('donations', DEFAULT_PAGE_SIZES.donations);
