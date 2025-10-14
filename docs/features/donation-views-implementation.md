# Donation Views Implementation

This document provides an overview of the donation views implementation within the Civics Lab application, including the recent fixes to address the missing database table issue.

## Table of Contents

1. [Overview](#overview)
2. [Database Structure](#database-structure)
3. [API Endpoints](#api-endpoints)
4. [Component Structure](#component-structure)
5. [Error Handling & Fallback Mechanisms](#error-handling--fallback-mechanisms)
6. [Drizzle Migrations](#drizzle-migrations)
7. [Troubleshooting](#troubleshooting)

## Overview

The donation views system allows users to create, customize, and save different views of donation data. Each view can have:

- Custom field visibility settings
- Saved filters
- Saved sorting preferences
- A unique name for easy identification

Views provide consistent ways to look at donation data across user sessions, making it easier for users to pick up where they left off.

## Database Structure

The donation views are stored in the `donation_views` table:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| view_name | text | Name of the view |
| workspace_id | uuid | Foreign key to workspaces table |
| amount | boolean | Whether to show amount column (default: true) |
| status | boolean | Whether to show status column (default: true) |
| payment_type | boolean | Whether to show payment type column (default: true) |
| notes | boolean | Whether to show notes column (default: false) |
| filters | jsonb | Saved filters configuration |
| sorting | jsonb | Saved sorting configuration |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| created_by | uuid | Foreign key to users table |

## API Endpoints

### GET /api/donation-views?workspace_id=[workspace_id]
Fetches all donation views for a workspace.

**Response:**
```json
{
  "views": [
    {
      "id": "uuid",
      "view_name": "Default View",
      "workspace_id": "workspace-uuid",
      "amount": true,
      "status": true,
      "payment_type": true,
      "notes": false,
      "filters": [],
      "sorting": [],
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

### GET /api/donation-views/[id]
Fetches a specific donation view by ID.

### POST /api/donation-views
Creates a new donation view.

**Request:**
```json
{
  "view_name": "New View",
  "workspace_id": "workspace-uuid",
  "amount": true,
  "status": true,
  "payment_type": true,
  "notes": false,
  "filters": [],
  "sorting": []
}
```

### PUT /api/donation-views/[id]
Updates an existing donation view.

### DELETE /api/donation-views/[id]
Deletes a donation view.

## Component Structure

### Main Components

1. **DonationsViewNavbar**: Contains the view selector dropdown and view settings
2. **DonationsFilterSortBar**: Manages filters, sorting, and search functionality
3. **DonationsDataGrid**: Displays donation data according to the current view
4. **DonationsViewModals**: Handles modal dialogs for creating/editing views

### Key Functionality

- **View Selection**: Users can select from saved views
- **View Creation**: Users can create custom views with specific fields
- **Field Toggling**: Toggle visibility of specific data columns
- **Filtering**: Apply and save complex filters
- **Sorting**: Apply and save custom sort orders
- **Persistence**: Views are persisted to the database and can be recalled later

## Error Handling & Fallback Mechanisms

The system includes robust error handling and fallback mechanisms:

### Database Error Detection

The frontend can detect when the `donation_views` table is missing:

```javascript
// Check for database relation not exist error
if (error.message && error.message.includes('relation "donation_views" does not exist')) {
  console.warn('Missing donation_views table detected - using local fallback view');
  createLocalFallbackView();
}
```

### Local Fallback View

When the database table is missing or inaccessible, the system creates a local temporary view:

```javascript
function createLocalFallbackView() {
  // Create a temporary view that will not be saved to the database
  const tempView = {
    id: 'temp-' + Math.random().toString(36).substring(2, 11),
    view_name: 'Default View (Local Only)',
    workspace_id: $workspaceStore.currentWorkspace?.id || '',
    amount: true,
    status: true,
    payment_type: true,
    notes: false,
    filters: [],
    sorting: [],
    created_at: new Date(),
    updated_at: new Date(),
    temporary: true // Flag to indicate this is a temporary view
  };
  
  // Set the view and notify user
  views.set([tempView]);
  currentView.set(tempView);
  filters.set([]);
  sorting.set([]);
  
  // Notify user of the database error
  toastStore.warning('Database issue detected: The donation_views table does not exist. Using a local view instead. Please contact your administrator.');
}
```

### Visual Indicators

Temporary views include a visual indicator:

```html
{#if currentView?.temporary}
  <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
    Local Only
  </span>
{/if}
```

### Temporary View Handling

The system adapts all view-related operations for temporary views:

```javascript
// Toggle a field's visibility in the current view
async function toggleField(fieldId) {
  if (!$currentView) return;
  
  // If we're using a temporary view, just update it locally
  if ($currentView.temporary) {
    const updatedView = { 
      ...$currentView, 
      [fieldId]: !$currentView[fieldId] 
    };
    currentView.set(updatedView);
    views.update(v => 
      v.map(view => view.id === $currentView.id 
        ? updatedView 
        : view
      )
    );
    return;
  }
  
  // Otherwise, proceed with API call...
}
```

## Drizzle Migrations

### Migration File Structure

The system uses Drizzle ORM for database migrations. The migration for the `donation_views` table is defined in:

- `/drizzle/0001_donation_views_table.sql` - SQL definition
- `/drizzle/meta/_journal.json` - Migration registry
- `/drizzle/meta/0001_snapshot.json` - Schema snapshot

### Migration SQL

```sql
CREATE TABLE IF NOT EXISTS "donation_views" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "view_name" text NOT NULL,
  "workspace_id" uuid,
  "amount" boolean DEFAULT true,
  "status" boolean DEFAULT true,
  "payment_type" boolean DEFAULT true,
  "notes" boolean DEFAULT false,
  "filters" jsonb,
  "sorting" jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "created_by" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_views" ADD CONSTRAINT "donation_views_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donation_views" ADD CONSTRAINT "donation_views_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donation_views_workspace_id_idx" ON "donation_views"("workspace_id");
```

### Running Migrations

To apply the migration and create the missing table:

```bash
npm run db:migrate
```

## Troubleshooting

### Common Issues

1. **"Failed to load views" Error**: 
   - This error occurs when the donation_views table doesn't exist in the database.
   - Solution: Run `npm run db:migrate` to create the missing table.

2. **"Access denied to this workspace" Error**:
   - This error occurs when the current user doesn't have access to the workspace.
   - Solution: Check user permissions in the user_workspaces table.

3. **Empty View List**:
   - If no views are available, the system will automatically create a default view.
   - If this fails, a temporary local view will be created.

### Debugging Steps

1. Check if the donation_views table exists:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'donation_views';
   ```

2. Verify the table structure:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'donation_views';
   ```

3. Check for any existing views:
   ```sql
   SELECT * FROM donation_views;
   ```

4. Examine browser console for detailed error messages.

5. Check network tab in developer tools for API response details.

### Recovery Actions

1. Run the database migration:
   ```bash
   npm run db:migrate
   ```

2. Restart the application after migration.

3. If issues persist, the application will use local temporary views that won't be saved to the database but will allow for continued use of the donation features.