# Contacts Filter/Sort Save Issue Fix

## Problem Description
When applying filters and sort options on the contacts route and clicking "Save Changes", the data grid would update but the filter and sort options were not being saved to the view in the database.

## Root Cause
The issue was in the `saveFilterSortChanges` function in `/src/routes/app/contacts/+page.svelte`. The function was:

1. Applying pending changes to local state correctly
2. Calling `updateView()` without parameters
3. The `updateView()` function couldn't determine what needed to be updated since no event was passed
4. This resulted in the view not being updated with the new filter and sort settings

## Solution
### 1. Fixed `saveFilterSortChanges` Function
Instead of calling the generic `updateView()` function, the fix directly calls the `updateContactView` API with the specific filter and sort data:

```typescript
// Update the view in the database with the new filter and sort data
const updatedView = {
  filters: $filters,
  sorting: $sorting
};

// Update using API
const result = await updateContactView($currentView.id, updatedView);

// Update local state
views.update(viewsList => 
  viewsList.map(view => view.id === $currentView.id 
    ? { ...view, ...updatedView } 
    : view
  )
);

currentView.update(view => ({ ...view, ...updatedView }));
```

### 2. Enhanced State Initialization
Added proper initialization of pending filter and sort states throughout the application:

- When views are loaded from the database
- When switching between views
- When creating new views
- When deleting views
- When restoring views from localStorage

### 3. Added Debug Logging
Added console logging to track:
- View selection with filter/sort data
- Save operations
- API responses

## Files Modified
- `/src/routes/app/contacts/+page.svelte` - Main fix implementation

## Testing
To verify the fix:

1. Navigate to the contacts route
2. Apply some filters and/or sorting options
3. Click "Save Changes"
4. Refresh the page or switch to another view and back
5. Verify that the filters and sorting are preserved

## Technical Details
The fix ensures that:
- Filter and sort changes are properly saved to the database
- Local state is kept in sync with the database
- Pending states are properly initialized when views are loaded
- Error handling provides meaningful feedback
- The UI reflects the saved state after page refresh

## API Integration
The fix leverages the existing API endpoints:
- `PUT /api/contact-views/[id]` - Updates view with new filter/sort data
- The API properly handles partial updates, preserving other view properties

This resolves the issue where filter and sort options appeared to be applied locally but were not persisted to the view configuration.
