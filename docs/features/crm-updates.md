# Contact Management System Updates

This document details the recent updates to the Contact Management system in the Civics Lab application.

## Overview of Changes

The contact management system has been improved to properly handle multiple contact-related records (phone numbers, email addresses, addresses, and social media accounts) for each contact. These improvements ensure data integrity and prevent accidental deletion of existing records when adding new ones.

## API Endpoint Changes

### PUT /api/contacts/[id]

The contact update endpoint (`PUT /api/contacts/[id]`) has been significantly improved to handle granular changes to related data:

#### Before:
Previously, the endpoint would delete all existing records (phones, emails, addresses, social media) and recreate them entirely with each update. This approach meant that:
- Adding a new phone number would delete all existing phone numbers
- Modifying one email would require resending all emails
- All data was recreated even if only a small portion changed

#### After:
The endpoint now implements a CRUD-based approach for each related data type:
- Records are marked with `isNew`, `isModified`, or `isDeleted` flags
- Only the necessary changes are made to the database
- Existing records remain untouched when adding new ones
- Data processing is handled individually for each record

Example of updated phone number handling:
```typescript
// Handle phone numbers: keep existing ones and add new ones
if (phoneNumbers) {
  console.log('Processing phone numbers update:', phoneNumbers);
  
  // Filter out valid phone numbers
  const validPhoneNumbers = phoneNumbers.filter(phone => 
    phone.phoneNumber && phone.phoneNumber.trim() !== '');
  
  if (validPhoneNumbers.length > 0) {
    // For each phone number, check if it's new, modified or deleted
    for (const phone of validPhoneNumbers) {
      if (phone.isNew) {
        // Add new phone number
        console.log('Adding new phone number:', phone.phoneNumber);
        await db.insert(contactPhoneNumbers).values({
          contactId: contactId,
          phoneNumber: phone.phoneNumber,
          status: phone.status || 'active',
          createdById: user.id,
          updatedById: user.id,
        });
      } else if (phone.isModified && phone.id) {
        // Update existing phone number
        console.log('Updating phone number with ID:', phone.id);
        await db
          .update(contactPhoneNumbers)
          .set({
            phoneNumber: phone.phoneNumber,
            status: phone.status || 'active',
            updatedById: user.id,
            updatedAt: new Date(),
          })
          .where(eq(contactPhoneNumbers.id, phone.id));
      } else if (phone.isDeleted && phone.id) {
        // Delete phone number
        console.log('Deleting phone number with ID:', phone.id);
        await db
          .delete(contactPhoneNumbers)
          .where(eq(contactPhoneNumbers.id, phone.id));
      }
    }
  }
}
```

This update was applied to all related data types:
- Phone Numbers
- Email Addresses
- Physical Addresses
- Social Media Accounts

### Tags Management

The tags system was also improved to follow a more efficient approach:
- Existing tags are compared against new tags
- Only the differences (tags to add, tags to remove) are processed
- This minimizes database operations and improves performance

## UI Component Updates

All contact detail components were updated to support the new CRUD approach:

### Common Improvements

For all detail components (`ContactPhones.svelte`, `ContactEmails.svelte`, etc.):

1. **Data Handling**:
   - New items are now properly marked with `isNew: true`
   - Modified items are marked with `isModified: true`
   - Deleted items are marked with `isDeleted: true`
   - Input fields now validate and trim values to prevent nulls

2. **Error Handling**:
   - Input validation was added to prevent empty/null values
   - Field values are sanitized before submission
   - Debug logging was added to track data flow

3. **Consistency**:
   - All components now follow the same pattern for adding/removing/updating items
   - The user experience remains consistent across all detail sections

Example of improved `updatePhone` function:
```typescript
function updatePhone(index, field, value) {
  phoneNumbers.update(items => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    if (item.id && !item.isNew) {
      // Mark as modified for existing items
      item.isModified = true;
    }
    
    // For phone_number field, ensure it's not null
    if (field === 'phone_number') {
      // Trim the value and store it, or empty string if null/undefined
      item[field] = value ? value.trim() : '';
    } else {
      item[field] = value;
    }
    
    return updatedItems;
  });
  handleChange();
}
```

### Service Layer Updates

The `contactService.ts` file was enhanced to properly handle data transformations:

1. **Data Validation**:
   - Filtering invalid records before sending to API
   - Ensuring required fields are present and properly formatted
   - Converting empty values to empty strings instead of null

2. **Field Mapping**:
   - Preserving ID and flag fields when mapping from frontend to API format
   - Explicit mapping between snake_case (UI) and camelCase (API) formats

3. **Error Handling**:
   - Improved error logging and debugging information
   - Better feedback on validation failures

Example of improved mapping in `updateContact`:
```typescript
// Map phone numbers from snake_case to camelCase
// Also filter out any invalid phone numbers to prevent DB errors
// Preserve isNew, isModified, and isDeleted flags for server-side logic
phoneNumbers: updateData.phoneNumbers
  ?.filter(phone => phone.phoneNumber && phone.phoneNumber.trim() !== '')
  .map(phone => ({
    id: phone.id, // Preserve ID for existing phone numbers
    phoneNumber: phone.phoneNumber, // Already mapped in ContactDetailsSheet
    status: phone.status,
    isNew: phone.isNew,
    isModified: phone.isModified,
    isDeleted: phone.isDeleted
  })),
```

## Benefits of the Changes

These improvements offer several key benefits:

1. **Data Integrity**: Existing records are preserved when adding new ones
2. **Performance**: Only necessary changes are sent to the database
3. **User Experience**: Multiple items can now be added without losing existing ones
4. **Error Prevention**: Better validation prevents common errors like null values
5. **Maintenance**: Consistent patterns make future updates easier to implement

## Workflow Impact

The changes improve the contact management workflow:

1. **Multiple Contact Methods**: Users can now add multiple phone numbers, email addresses, addresses, and social media accounts for each contact
2. **Efficient Updates**: Changing one item doesn't require resending all items
3. **Better Data Management**: Granular control over what gets added, updated, or removed

This update significantly enhances the robustness and usability of the contact management system while maintaining compatibility with the existing UI flow.
