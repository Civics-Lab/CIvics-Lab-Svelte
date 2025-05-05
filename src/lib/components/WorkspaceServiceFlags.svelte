<script lang="ts">
  import { onMount } from 'svelte';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { toast } from '@zerodevx/svelte-toast';
  
  export let workspaceId: string;
  
  let isLoading = true;
  let isSaving = false;
  let serviceFlags = {
    hasEngage: true,
    hasHelpdesk: false,
    hasPathway: false,
    hasPulse: false,
    hasCompass: false
  };
  let originalFlags = { ...serviceFlags };
  let hasChanges = false;
  
  // User role state
  let userIsSuperAdmin = false;
  
  // Service descriptions
  const serviceDescriptions = {
    engage: "CRM service for managing contacts and businesses",
    helpdesk: "Support ticket system for handling user requests",
    pathway: "Educational materials & tutorials service",
    pulse: "Community forum for workspace members",
    compass: "Supplemental campaign manager service"
  };
  
  onMount(async () => {
    // Check if user is a Super Admin for this workspace
    const workspace = $workspaceStore?.workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      userIsSuperAdmin = workspace.userRole === 'Super Admin';
    }
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/service-flags`);
      
      if (response.ok) {
        const data = await response.json();
        serviceFlags = data.serviceFlags;
        originalFlags = { ...serviceFlags };
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch service flags' }));
        toast.push(errorData.error || 'Failed to fetch service flags', { classes: ['error'] });
      }
    } catch (error) {
      console.error('Error fetching service flags:', error);
      toast.push('Failed to load service flags', { classes: ['error'] });
    } finally {
      isLoading = false;
    }
  });
  
  // Check for changes to enable/disable save button
  $: hasChanges = JSON.stringify(serviceFlags) !== JSON.stringify(originalFlags);
  
  async function saveServiceFlags() {
    if (!userIsSuperAdmin) {
      toast.push('Only Super Admins can update service flags', { classes: ['warning'] });
      return;
    }
    
    isSaving = true;
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/service-flags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serviceFlags)
      });
      
      if (response.ok) {
        const data = await response.json();
        serviceFlags = data.serviceFlags;
        originalFlags = { ...serviceFlags };
        
        // Update the workspace store with the new service flags
        const workspace = $workspaceStore.workspaces.find(w => w.id === workspaceId);
        if (workspace) {
          const updatedWorkspace = {
            ...workspace,
            ...serviceFlags
          };
          workspaceStore.updateWorkspace(updatedWorkspace);
        }
        
        toast.push('Service flags updated successfully', { classes: ['success'] });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update service flags' }));
        toast.push(errorData.error || 'Failed to update service flags', { classes: ['error'] });
      }
    } catch (error) {
      console.error('Error updating service flags:', error);
      toast.push('Failed to update service flags', { classes: ['error'] });
    } finally {
      isSaving = false;
    }
  }
  
  function resetForm() {
    serviceFlags = { ...originalFlags };
  }
</script>

<div class="service-flags-container">
  <h2>Workspace Service Access</h2>
  
  {#if isLoading}
    <div class="loading">Loading service flags...</div>
  {:else}
    <div class="description">
      <p>Control which services this workspace has access to. Only Super Admins can modify these settings.</p>
    </div>
    
    <div class="service-flags-form">
      <div class="service-flag-item">
        <label>
          <input
            type="checkbox"
            bind:checked={serviceFlags.hasEngage}
            disabled={!userIsSuperAdmin || isSaving}
          />
          <span class="service-name">Engage</span>
        </label>
        <p class="service-description">{serviceDescriptions.engage}</p>
      </div>
      
      <div class="service-flag-item">
        <label>
          <input
            type="checkbox"
            bind:checked={serviceFlags.hasHelpdesk}
            disabled={!userIsSuperAdmin || isSaving}
          />
          <span class="service-name">HelpDesk</span>
        </label>
        <p class="service-description">{serviceDescriptions.helpdesk}</p>
      </div>
      
      <div class="service-flag-item">
        <label>
          <input
            type="checkbox"
            bind:checked={serviceFlags.hasPathway}
            disabled={!userIsSuperAdmin || isSaving}
          />
          <span class="service-name">Pathway</span>
        </label>
        <p class="service-description">{serviceDescriptions.pathway}</p>
      </div>
      
      <div class="service-flag-item">
        <label>
          <input
            type="checkbox"
            bind:checked={serviceFlags.hasPulse}
            disabled={!userIsSuperAdmin || isSaving}
          />
          <span class="service-name">Pulse</span>
        </label>
        <p class="service-description">{serviceDescriptions.pulse}</p>
      </div>
      
      <div class="service-flag-item">
        <label>
          <input
            type="checkbox"
            bind:checked={serviceFlags.hasCompass}
            disabled={!userIsSuperAdmin || isSaving}
          />
          <span class="service-name">Compass</span>
        </label>
        <p class="service-description">{serviceDescriptions.compass}</p>
      </div>
    </div>
    
    {#if !userIsSuperAdmin}
      <div class="permission-notice">
        <p>Only Super Admins can modify service access flags.</p>
      </div>
    {:else}
      <div class="actions">
        <button
          class="btn secondary"
          on:click={resetForm}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </button>
        <button
          class="btn primary"
          on:click={saveServiceFlags}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .service-flags-container {
    padding: 1.5rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .description {
    margin-bottom: 1.5rem;
    color: #666;
  }
  
  .service-flags-form {
    display: grid;
    gap: 1rem;
  }
  
  .service-flag-item {
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .service-flag-item:hover {
    background-color: #f9f9f9;
  }
  
  label {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 0.5rem;
    cursor: pointer;
  }
  
  input[type="checkbox"] {
    margin-right: 0.75rem;
    cursor: pointer;
  }
  
  .service-name {
    font-size: 1.1rem;
  }
  
  .service-description {
    margin: 0;
    margin-left: 1.75rem;
    color: #666;
    font-size: 0.9rem;
  }
  
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn.primary {
    background-color: #3f51b5;
    color: white;
  }
  
  .btn.primary:hover:not(:disabled) {
    background-color: #303f9f;
  }
  
  .btn.secondary {
    background-color: #f5f5f5;
    color: #333;
  }
  
  .btn.secondary:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .loading {
    color: #666;
    font-style: italic;
    padding: 1rem 0;
  }
  
  .permission-notice {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #fff8e1;
    border-left: 4px solid #ffc107;
    border-radius: 4px;
  }
  
  .permission-notice p {
    margin: 0;
    color: #856404;
  }
</style>