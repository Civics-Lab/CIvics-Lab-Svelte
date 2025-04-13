// src/routes/+layout.ts
import { browser } from '$app/environment';
import { goto, beforeNavigate } from '$app/navigation';
import { workspaceStore } from '$lib/stores/workspaceStore';
import { userStore } from '$lib/stores/userStore';
import { get } from 'svelte/store';

// Setup function to set workspace ID in requests
function setupWorkspaceHeaders() {
  if (browser) {
    const currentWorkspaceId = localStorage.getItem('currentWorkspaceId');
    
    // Set the workspace ID cookie for server-side use
    if (currentWorkspaceId) {
      document.cookie = `currentWorkspaceId=${currentWorkspaceId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
    }
    
    // Override fetch to include workspace ID header
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      init = init || {};
      init.headers = init.headers || {};
      
      // Get current workspace ID from localStorage
      const workspaceId = localStorage.getItem('currentWorkspaceId');
      
      // Add workspace ID header if available
      if (workspaceId) {
        init.headers = {
          ...init.headers,
          'X-Workspace-ID': workspaceId
        };
      }
      
      return originalFetch(input, init);
    };
  }
}

// This runs in the browser
export const load = async ({ data }) => {
  if (browser) {
    // Initialize auth and workspace state
    if (data.user) {
      userStore.setUser(data.user, data.token);
    }
    
    if (data.workspaces) {
      // Initialize workspaces from server data
      workspaceStore.setWorkspaces(data.workspaces, data.currentWorkspace?.id);
    }
    
    // Setup workspace headers for API requests
    setupWorkspaceHeaders();
    
    // If no workspace is selected but we have workspaces, select the first one
    const workspaces = get(workspaceStore).workspaces;
    const currentWorkspace = get(workspaceStore).currentWorkspace;
    
    if (!currentWorkspace && workspaces.length > 0) {
      workspaceStore.setCurrentWorkspace(workspaces[0].id, workspaces[0]);
    }
  }
  
  return {
    ...data
  };
};

// Add event listener to update headers when workspace changes
if (browser) {
  workspaceStore.subscribe(state => {
    if (state.currentWorkspace) {
      document.cookie = `currentWorkspaceId=${state.currentWorkspace.id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
    }
  });
}
