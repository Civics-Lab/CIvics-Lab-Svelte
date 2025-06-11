// src/lib/config/pagination.ts

// Configuration for pagination behavior
export const PAGINATION_CONFIG = {
  // Set to true for client-side filtering (good for small datasets < 1000 contacts)
  // Set to false for server-side filtering (recommended for large datasets)
  useClientSideFiltering: false,
  
  // Default page sizes
  defaultPageSize: 250,
  pageSizeOptions: [50, 100, 250, 500, 1000],
  
  // Server-side search debounce timeout (ms)
  searchDebounceMs: 300,
  
  // Client-side filter debounce timeout (ms)  
  clientDebounceMs: 100,
  
  // Maximum records for client-side mode
  maxClientSideRecords: 10000,
} as const;

export type PaginationConfig = typeof PAGINATION_CONFIG;
