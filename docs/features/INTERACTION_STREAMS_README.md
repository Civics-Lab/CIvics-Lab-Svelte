# Interaction History System (Stream) Documentation

## Overview

The Interaction History system allows users to track all communications and interactions with contacts and businesses. It's called a "Stream" and appears as a timeline of activities.

## Features

### 1. Interaction Types
- **Note**: General notes and observations
- **Call**: Phone call records
- **Email**: Email communication logs  
- **In Person**: Face-to-face meeting records

### 2. Stream Locations

#### Contact/Business Details Sheet
- **Location**: Left column in expanded details sheet
- **Width**: 384px (24rem) fixed width
- **Features**: Add, edit, delete interactions specific to that entity

#### Dashboard Timeline
- **Location**: Main dashboard page, left side
- **Features**: Shows recent interactions across all contacts and businesses in the workspace

### 3. Data Structure

#### InteractionStream Schema
```typescript
interface InteractionStream {
  id: string;
  workspaceId: string;
  contactId?: string;     // Either contactId OR businessId
  businessId?: string;    // Either contactId OR businessId
  interactionType: 'note' | 'call' | 'email' | 'in_person';
  title: string;          // Brief summary
  content: string;        // Detailed notes
  interactionDate: Date;  // When the interaction occurred
  status: 'active' | 'archived' | 'deleted';
  metadata?: object;      // Optional metadata (e.g., phone number called, email address)
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
}
```

## Implementation Details

### 1. API Endpoints

#### GET `/api/interaction-streams`
Query parameters:
- `workspace_id` (required)
- `contact_id` (optional)
- `business_id` (optional)
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

#### POST `/api/interaction-streams`
Create new interaction stream

#### PUT `/api/interaction-streams/[id]`
Update existing interaction stream

#### DELETE `/api/interaction-streams/[id]`
Soft delete (sets status to 'deleted')

### 2. Service Functions

```typescript
// Fetch streams for entity
fetchInteractionStreams(workspaceId, { contactId?, businessId?, limit?, offset? })

// Create new stream
createInteractionStream(data: CreateInteractionStreamData)

// Update stream
updateInteractionStream(id, data: UpdateInteractionStreamData)

// Delete stream
deleteInteractionStream(id)

// Get recent workspace activity
fetchRecentWorkspaceStreams(workspaceId, limit?)
```

### 3. Components

#### InteractionStream Component
- **Path**: `$lib/components/shared/InteractionStream.svelte`
- **Props**: 
  - `entityType: 'contact' | 'business'`
  - `entityId: string`
  - `isSaving: boolean`
- **Events**: `on:change` (when interactions are modified)

#### Timeline Component
- **Path**: `$lib/components/shared/Timeline.svelte`
- **Props**: `limit: number` (default: 10)
- **Usage**: Dashboard recent activity display

### 4. Updated Detail Sheets

Both ContactDetailsSheet and BusinessDetailsSheet now have:
- **Two-column layout**: Stream (left) + Details (right)
- **Increased width**: From max-w-2xl to max-w-5xl
- **Stream integration**: Automatic loading of entity-specific interactions

## Usage Instructions

### Adding an Interaction

1. Open contact or business details sheet
2. In the left "Interaction History" column, click "Add Interaction"
3. Select interaction type (Note, Call, Email, In Person)
4. Set date/time (defaults to current time)
5. Add title and detailed notes
6. Click "Save"

### Editing an Interaction

1. In the interaction stream, click the edit icon (pencil)
2. Modify title, content, or date
3. Click "Save" or "Cancel"

### Deleting an Interaction

1. In the interaction stream, click the delete icon (trash)
2. Confirm deletion
3. Interaction is soft-deleted (status set to 'deleted')

### Viewing Recent Activity

1. Go to the main dashboard
2. The "Recent Activity" panel shows the latest interactions across the workspace
3. Displays entity name, interaction type, title, and time ago

## Database Schema

### Table: interaction_streams

```sql
CREATE TABLE interaction_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('note', 'call', 'email', 'in_person')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT check_entity_reference CHECK (
        (contact_id IS NOT NULL AND business_id IS NULL) OR 
        (contact_id IS NULL AND business_id IS NOT NULL)
    )
);
```

### Indexes

- `idx_interaction_streams_workspace_id`
- `idx_interaction_streams_contact_id`
- `idx_interaction_streams_business_id`
- `idx_interaction_streams_interaction_date`
- `idx_interaction_streams_workspace_date` (composite)
- `idx_interaction_streams_contact_date` (composite)
- `idx_interaction_streams_business_date` (composite)

## Migration

To set up the interaction streams table:

```bash
npm run db:migrate-streams
# or
tsx src/lib/db/migrate-interaction-streams.ts
```

## Future Enhancements

1. **Rich metadata support**: Store phone numbers for calls, email addresses for emails
2. **File attachments**: Allow uploading files to interactions
3. **Integration with external tools**: Sync with email clients, calendar apps
4. **Bulk operations**: Mark multiple interactions as archived
5. **Search and filtering**: Full-text search across interaction content
6. **Templates**: Pre-defined interaction templates for common scenarios
7. **Notifications**: Alert users about follow-up actions or scheduled interactions

## Notes

- The system uses soft deletes (status = 'deleted') to maintain audit trails
- All interactions are workspace-scoped
- Either contactId OR businessId must be provided (not both)
- Interactions are ordered by interaction_date descending (newest first)
- The system is designed to scale with proper database indexing