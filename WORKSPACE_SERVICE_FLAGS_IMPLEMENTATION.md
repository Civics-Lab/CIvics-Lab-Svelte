# Workspace Service Flags Implementation Guide

This guide outlines the steps to implement service flags for your Civics Lab Svelte webapp.

## Step 1: Run the Database Migration

First, let's apply the database migration to add the service flag columns to the workspaces table:

```bash
npm run db:migrate
```

This will apply the `0005_workspace_service_flags.sql` migration that adds the following columns to the workspaces table:
- `has_engage` (boolean, default true)
- `has_helpdesk` (boolean, default false)
- `has_pathway` (boolean, default false)
- `has_pulse` (boolean, default false)
- `has_compass` (boolean, default false)

## Step 2: Restore the Schema Definition

After the migration is complete, restore the schema definition by uncommenting the service flag fields in the workspaces table:

1. Edit `src/lib/db/drizzle/schema.ts`
2. Uncomment the service flag fields in the workspaces table:

```typescript
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logo: text('logo'),
  // Uncomment these lines:
  hasEngage: boolean('has_engage').default(true).notNull(),
  hasHelpdesk: boolean('has_helpdesk').default(false).notNull(),
  hasPathway: boolean('has_pathway').default(false).notNull(),
  hasPulse: boolean('has_pulse').default(false).notNull(),
  hasCompass: boolean('has_compass').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id)
});
```

## Step 3: Create Service Flag Components

Next, create the UI component for managing service flags. We've already added the `serviceGuard.ts` utility and the service flags API endpoint.

Create a new file `src/lib/components/WorkspaceServiceFlags.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { workspaceStore } from '$lib/stores/workspaceStore';
  import { isSuperAdmin } from '$lib/utils/serviceGuard';
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
```

## Step 4: Add the Component to Settings Page

Add the `WorkspaceServiceFlags` component to the workspace settings page. Edit `src/routes/app/settings/workspace/+page.svelte`:

```svelte
<script>
  import { page } from '$app/stores';
  import WorkspaceServiceFlags from '$lib/components/WorkspaceServiceFlags.svelte';
  
  // Existing script code...
</script>

<!-- Add this where you want the service flags UI to appear -->
<div class="settings-section">
  <WorkspaceServiceFlags workspaceId={$page.data.activeWorkspace?.id} />
</div>
```

## Step 5: Update Navigation to Show/Hide Service Links

Modify your navigation component to show/hide service links based on workspace access. Update your main navigation component (location depends on your project structure):

```svelte
<script>
  import { page } from '$app/stores';
  import { activeWorkspace } from '$lib/stores/workspaceStore';
  import { SERVICES, hasServiceAccess } from '$lib/utils/serviceGuard';
  
  // Other existing script code...
</script>

<!-- In the navigation template -->
{#if $activeWorkspace}
  <nav class="services-nav">
    <ul>
      <!-- Only show service links for services the workspace has access to -->
      {#if hasServiceAccess($activeWorkspace, SERVICES.ENGAGE)}
        <li class:active={$page.url.pathname.startsWith('/engage')}>
          <a href="/engage">Engage</a>
        </li>
      {/if}
      
      {#if hasServiceAccess($activeWorkspace, SERVICES.HELPDESK)}
        <li class:active={$page.url.pathname.startsWith('/helpdesk')}>
          <a href="/helpdesk">HelpDesk</a>
        </li>
      {/if}
      
      {#if hasServiceAccess($activeWorkspace, SERVICES.PATHWAY)}
        <li class:active={$page.url.pathname.startsWith('/pathway')}>
          <a href="/pathway">Pathway</a>
        </li>
      {/if}
      
      {#if hasServiceAccess($activeWorkspace, SERVICES.PULSE)}
        <li class:active={$page.url.pathname.startsWith('/pulse')}>
          <a href="/pulse">Pulse</a>
        </li>
      {/if}
      
      {#if hasServiceAccess($activeWorkspace, SERVICES.COMPASS)}
        <li class:active={$page.url.pathname.startsWith('/compass')}>
          <a href="/compass">Compass</a>
        </li>
      {/if}
    </ul>
  </nav>
{/if}
```

## Step 6: Add Service Access Guards to Routes

Add access guards to each service's layout file. For example, for the Engage service, create or update `src/routes/engage/+layout.server.ts`:

```typescript
import { requireServiceAccess, SERVICES } from '$lib/utils/serviceGuard';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Check if user is authenticated
  const user = locals.user;
  
  if (!user) {
    throw redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
  }
  
  // Check if the user has an active workspace
  const activeWorkspace = locals.workspace;
  
  if (!activeWorkspace) {
    throw redirect(303, '/app?error=no-workspace');
  }
  
  // Check if the workspace has access to the Engage service
  requireServiceAccess(activeWorkspace, SERVICES.ENGAGE);
  
  // If we get here, the workspace has access to Engage
  return {
    user,
    activeWorkspace
  };
};
```

Repeat this pattern for each service route directory (helpdesk, pathway, pulse, compass).

## Step 7: Testing

After completing the implementation, test the functionality:

1. Log in as a Super Admin user and navigate to the workspace settings page
2. Verify you can see and modify the service flags
3. Toggle service flags off and on, and save changes
4. Verify that services with disabled flags are hidden from the navigation
5. Try to access a disabled service directly via URL and check that you're redirected
6. Log in as a non-Super Admin user and verify you cannot modify service flags

## Troubleshooting

If you encounter any issues:

1. Check that the database migration was successful:
   ```bash
   psql -U your_db_user -d your_db_name -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'workspaces';"
   ```

2. Verify the schema file includes the service flag fields:
   ```bash
   grep -A 6 "has_engage" src/lib/db/drizzle/schema.ts
   ```

3. Check for errors in the browser console or server logs

4. Restart the development server:
   ```bash
   npm run dev
   ```

## Next Steps

After implementing the service flags feature, consider these enhancements:

1. Add service-specific role permissions
2. Implement automatic service provisioning based on subscription plans
3. Add usage tracking for each service
4. Create a dashboard for admins to monitor service usage across workspaces
