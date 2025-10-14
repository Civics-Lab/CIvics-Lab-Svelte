# Workspace Management

This document provides details about the workspace management functionality in the Civics Lab application, including recent fixes to the workspace selection persistence.

## Table of Contents

1. [Overview](#overview)
2. [Key Components](#key-components)
3. [Workspace Store](#workspace-store)
4. [Workspace Selection UI](#workspace-selection-ui)
5. [Workspace Context](#workspace-context)
6. [Persistence Issues & Fixes](#persistence-issues--fixes)

## Overview

The Civics Lab application supports multiple workspaces per user, allowing users to organize their data into separate contexts. Workspaces provide data isolation while allowing a single user to access multiple workspaces (for example, to manage different campaigns or organizations).

Each user can belong to multiple workspaces with different roles. The application maintains the user's selected workspace across page navigation and browser refreshes.

## Key Components

The workspace management system consists of three primary components:

1. **Workspace Store** (`src/lib/stores/workspaceStore.ts`): Manages the state of workspaces and the currently selected workspace
2. **Workspace Selector UI** (`src/lib/components/WorkspaceSelector.svelte`): Provides the UI for selecting and switching between workspaces
3. **Workspace Context** (`src/lib/components/WorkspaceContext.svelte`): Sets up the workspace context and handles initialization

## Workspace Store

The workspace store is implemented as a Svelte store that maintains:

- The list of workspaces the user has access to
- The currently selected workspace
- Loading and error states

```typescript
interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
}
```

Key functions in the workspace store include:

- `setWorkspaces(workspaces, currentId?)`: Updates the list of workspaces and optionally sets the current workspace
- `setCurrentWorkspace(workspaceId, workspaceData?)`: Sets the current workspace and saves it to localStorage
- `refreshWorkspaces(supabase)`: Fetches workspaces from the database and updates the store
- `reset()`: Resets the store to its initial state

## Workspace Selection UI

The `WorkspaceSelector.svelte` component provides a dropdown UI for selecting workspaces. Key features:

- Displays the name of the currently selected workspace
- Shows a list of available workspaces to switch between
- Highlights the currently selected workspace
- Provides an option to create a new workspace
- Uses the workspace store to update the current selection

## Workspace Context

The `WorkspaceContext.svelte` component initializes the workspace context for the application. It:

- Fetches the user's workspaces on mount
- Sets up authentication state listeners
- Manages workspace selection persistence
- Handles workspace creation

## Persistence Issues & Fixes

### Issue

When a user with multiple workspaces refreshed the page while logged in, the application would reset the selected workspace to the first one in the list, rather than maintaining the previously selected workspace.

### Root Cause

The issue was in the priority ordering of workspace selection during page refresh. The application wasn't correctly prioritizing the workspace ID stored in localStorage when refreshing the list of workspaces.

### Implemented Fixes

1. **Updated Workspace Selection Priority**

   Modified the `setWorkspaces` function to respect the following priority order:
   - First, use explicitly provided workspace ID parameter (if any)
   - Second, maintain the currently selected workspace if it exists in the new workspace list
   - Only fall back to the first workspace if no current selection can be maintained

   ```typescript
   setWorkspaces: (workspaces: Workspace[], currentId?: string) => {
     update(state => {
       let current: Workspace | null = null;
       
       if (currentId) {
         // 1. Use explicitly provided ID
         current = workspaces.find(w => w.id === currentId) || null;
       } else if (state.currentWorkspace?.id) {
         // 2. Maintain current selection if it exists in the new workspace list
         current = workspaces.find(w => w.id === state.currentWorkspace?.id) || null;
       }
       
       // 3. Fall back to first workspace only if no current selection exists
       if (!current && workspaces.length > 0) {
         current = workspaces[0];
       }
         
       return {
         ...state,
         workspaces,
         currentWorkspace: current,
         isLoading: false
       };
     });
   }
   ```

2. **Enhanced localStorage Priority in `refreshWorkspaces`**

   Modified the `refreshWorkspaces` function to always prioritize the workspace ID from localStorage during page refresh:

   ```typescript
   // On page refresh, always prioritize the value from localStorage
   // if it exists and is valid
   let currentWorkspace = null;
   
   if (savedWorkspaceId) {
     // Try to find the workspace with the saved ID
     currentWorkspace = fetchedWorkspaces.find(w => w.id === savedWorkspaceId);
   }
   
   // If no valid workspace was found from localStorage, use the current one if it exists
   if (!currentWorkspace && state.currentWorkspace) {
     currentWorkspace = fetchedWorkspaces.find(w => w.id === state.currentWorkspace?.id);
   }
   
   // Fallback to the first workspace if no other selection is valid
   if (!currentWorkspace && fetchedWorkspaces.length > 0) {
     currentWorkspace = fetchedWorkspaces[0];
   }
   ```

3. **Improved Workspace Selection in UI**

   Enhanced the `selectWorkspace` function in `WorkspaceSelector.svelte` to explicitly save to localStorage before calling the store method:

   ```typescript
   function selectWorkspace(workspace: Workspace) {
     // Explicitly store in localStorage first
     if (typeof window !== 'undefined') {
       localStorage.setItem('currentWorkspaceId', workspace.id);
     }
     workspaceStore.setCurrentWorkspace(workspace.id);
     isOpen.set(false);
   }
   ```

4. **Improved Debugging**

   Added extensive console logging throughout the workspace management code to help identify any issues with the order of operations.

### Results

With these changes, the application now correctly maintains the user's selected workspace when refreshing the page. The priority order ensures that:

1. If a workspace ID is saved in localStorage, it will be used to set the current workspace
2. If the saved workspace ID doesn't match any available workspace, it will try to maintain the current selection from state
3. Only if no valid workspace is found from either source will it fall back to the first workspace in the list

This ensures a consistent user experience where workspace selection persists across page refreshes and navigation.
