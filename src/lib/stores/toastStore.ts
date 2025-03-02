// src/lib/stores/toastStore.ts
import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Simple UUID generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  
  function addToast(message: string, type: ToastType = 'success', duration: number = 5000) {
    const id = generateId();
    update(toasts => [
      ...toasts,
      { id, message, type, duration }
    ]);
    
    return id;
  }
  
  function removeToast(id: string) {
    update(toasts => toasts.filter(toast => toast.id !== id));
  }
  
  return {
    subscribe,
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    remove: removeToast
  };
}

export const toastStore = createToastStore();