/**
 * Utility functions to help sync workspace data between localStorage and cookies
 */

/**
 * Synchronizes the current workspace ID between localStorage and the server
 * @returns {Promise<boolean>} - True if sync was successful
 */
export async function syncCurrentWorkspaceWithServer() {
  try {
    // Get current workspace ID from localStorage
    const workspaceId = localStorage.getItem('current_workspace_id');
    
    if (!workspaceId) {
      console.log('No workspace ID in localStorage to sync');
      return false;
    }
    
    console.log('Syncing workspace ID with server:', workspaceId);
    
    // Send to server to set in cookies
    const response = await fetch('/api/workspaces/set-current', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ workspaceId })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    console.log('Successfully synced workspace ID with server');
    return true;
  } catch (error) {
    console.error('Error syncing workspace with server:', error);
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
