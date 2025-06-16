# Tag Autocomplete Implementation

This implementation provides autocomplete functionality for tags in business and contact create modals and detail sheet forms. Users can see existing tags that match their input and select from them or create new tags.

## Features

- **Show All Available Tags**: When users click on the input field, they see all existing tags from their workspace
- **Real-time Filtering**: As users type, the list filters to show matching tags
- **Debounced Search**: Tag suggestions are fetched with a 300ms debounce to avoid excessive API calls
- **Keyboard Navigation**: Users can press Enter to select the first suggestion or add a new tag
- **Visual Feedback**: Loading indicators, hover states, and clear visual hierarchy
- **Cross-Entity Support**: Works for businesses, contacts, and donations with entity-specific styling

## Components

### AutocompleteTags.svelte
Located: `src/lib/components/shared/AutocompleteTags.svelte`

A reusable component that provides autocomplete functionality for tag input. Supports:
- Real-time tag suggestions from workspace
- Add/remove tag functionality
- Entity-specific styling and labels
- Loading states and error handling

**Props:**
- `tags`: Svelte store containing current tags array
- `isSaving`: Boolean indicating if form is being saved
- `entityType`: 'contact' | 'business' | 'donation' for styling and API endpoints
- `entityId`: Optional ID for existing entities (detail sheets)

**Events:**
- `change`: Dispatched when tags are added/removed

### Usage Example

```svelte
<script>
  import { writable } from 'svelte/store';
  import AutocompleteTags from '$lib/components/shared/AutocompleteTags.svelte';
  
  const tags = writable(['existing-tag']);
  
  function handleTagsChange() {
    console.log('Tags changed:', $tags);
  }
</script>

<AutocompleteTags 
  {tags}
  isSaving={false}
  entityType="business"
  on:change={handleTagsChange}
/>
```

## API Endpoints

### Business Tags
- `GET /api/business-tags?workspace_id=[id]&query=[search]` - Get tag suggestions
- `GET /api/business-tags?business_id=[id]` - Get tags for specific business
- `POST /api/business-tags` - Create new tag
- `DELETE /api/business-tags/[id]` - Delete tag

### Contact Tags
- `GET /api/contact-tags?workspace_id=[id]&query=[search]` - Get tag suggestions
- `GET /api/contact-tags?contact_id=[id]` - Get tags for specific contact
- `POST /api/contact-tags` - Create new tag
- `DELETE /api/contact-tags/[id]` - Delete tag

### Donation Tags
- `GET /api/donation-tags?query=[search]` - Get tag suggestions
- `GET /api/donation-tags?donation_id=[id]` - Get tags for specific donation
- `POST /api/donation-tags` - Create new tag
- `DELETE /api/donation-tags/[id]` - Delete tag

## Implementation Details

### Database Schema
The implementation uses existing tables:
- `business_tags`: Stores business tags (linked via businesses.workspace_id for suggestions)
- `contact_tags`: Stores contact tags (has workspace_id field)
- `donation_tags`: Stores donation tags (linked via donations to contacts/businesses)

### Tag Suggestions Algorithm
1. User clicks on the tag input field
2. All available tags are fetched and displayed (up to 20)
3. As user types, results are filtered in real-time
4. Database queries use debounced API calls (300ms)
5. Results are filtered to exclude already-selected tags

### Security
- All API endpoints check user authentication
- Workspace access is verified before returning suggestions
- Users can only see/modify tags within their accessible workspaces

## Files Modified

### Components Updated
- `BusinessFormModal.svelte`: Replaced GenericTags with AutocompleteTags
- `BusinessDetailsSheet.svelte`: Replaced GenericTags with AutocompleteTags
- `ContactFormModal.svelte`: Replaced ContactTags with AutocompleteTags
- `ContactDetailsSheet.svelte`: Replaced GenericTags with AutocompleteTags

### New API Endpoints
- `src/routes/api/business-tags/+server.ts`
- `src/routes/api/business-tags/[id]/+server.ts`
- `src/routes/api/contact-tags/+server.ts`
- `src/routes/api/contact-tags/[id]/+server.ts`

### New Components
- `src/lib/components/shared/AutocompleteTags.svelte`

## Performance Considerations

- **Debounced Requests**: 300ms debounce prevents excessive API calls
- **Smart Limits**: 10 suggestions when filtering, 20 when showing all
- **Indexed Queries**: Database queries use indexed fields for fast lookups
- **Client-side Filtering**: Already-selected tags filtered on frontend
- **Efficient Loading**: Only fetches when field is focused or input changes

## Future Enhancements

1. **Keyboard Navigation**: Arrow key navigation through suggestions
2. **Tag Categories**: Support for categorized tags
3. **Tag Colors**: Visual tag colors/categories
4. **Tag Statistics**: Show usage frequency for suggestions
5. **Bulk Tag Operations**: Apply tags to multiple entities
6. **Tag Aliases**: Support for tag synonyms/aliases

## Testing

To test the autocomplete functionality:

1. Navigate to a business or contact (create new or edit existing)
2. Go to the Tags section
3. Click on the tag input field to see all available tags
4. Start typing to filter the suggestions in real-time
5. Click a suggestion to select it, or press Enter to add the current input
6. Verify tags are saved correctly

## Troubleshooting

**No suggestions appearing:**
- Check browser network tab for API calls
- Verify workspace is properly set in workspaceStore
- Ensure user has access to the workspace

**API errors:**
- Check server logs for detailed error messages
- Verify database tables exist and have proper schema
- Confirm user authentication is working

**Styling issues:**
- Component uses Tailwind classes, ensure Tailwind is properly configured
- Different entity types have different color schemes
