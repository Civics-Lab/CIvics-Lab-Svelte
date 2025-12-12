/**
 * Utility functions to help sync workspace data with localStorage
 * Updated for standalone API - server-side sync not required
 */

/**
 * Validates the current workspace ID in localStorage
 * @returns {Promise<boolean>} - True if workspace ID exists and is valid
 */
export async function syncCurrentWorkspaceWithServer() {
  try {
    // Get current workspace ID from localStorage
    const workspaceId = localStorage.getItem('current_workspace_id');

    if (!workspaceId) {
      console.log('No workspace ID in localStorage');
      return false;
    }

    console.log('Workspace ID in localStorage:', workspaceId);

    // Note: /api/workspaces/set-current endpoint not available in standalone API
    // LocalStorage persistence is sufficient for the frontend
    // The standalone API validates workspace access on each request via JWT

    return true;
  } catch (error) {
    console.error('Error checking workspace:', error);
    return false;
  }
}

/**
 * Force reloads the page to apply workspace changes
 * @param {number} delay - Delay in milliseconds before reloading
 */
export function reloadPageWithDelay(delay = 500) {
  setTimeout(() => {
    window.location.reload();
  }, delay);
}

/**
 * Complete flow to set workspace and reload page
 * @param {string} workspaceId - The workspace ID to set
 */
export async function setWorkspaceAndReload(workspaceId) {
  // Set in localStorage
  localStorage.setItem('current_workspace_id', workspaceId);
  
  // Sync with server
  await syncCurrentWorkspaceWithServer();
  
  // Reload page
  reloadPageWithDelay();
}
