// src/lib/stores/sidebarStore.ts
import { writable } from 'svelte/store';

// Create a writable store for sidebar visibility, defaulting to open (true)
export const sidebarVisible = writable(true);

// Helper function to toggle sidebar
export function toggleSidebar() {
  sidebarVisible.update(visible => !visible);
}

// Helper function to show sidebar
export function showSidebar() {
  sidebarVisible.set(true);
}

// Helper function to hide sidebar
export function hideSidebar() {
  sidebarVisible.set(false);
}