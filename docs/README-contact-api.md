# Contact API Documentation

This document provides detailed information about the Contact API in the Civics Lab SvelteKit application, with a focus on how data is handled for multiple related records like phone numbers, emails, addresses, and social media accounts.

## Table of Contents
- [Introduction](#introduction)
- [API Overview](#api-overview)
- [CRUD Operations](#crud-operations)
  - [Create](#create)
  - [Read](#read)
  - [Update](#update)
  - [Delete](#delete)
- [Data Structure](#data-structure)
- [UI Components](#ui-components)
- [Workflow Examples](#workflow-examples)
- [Best Practices](#best-practices)

## Introduction

The Contact API is designed to handle contact data with multiple related records. Instead of replacing all related records when one changes, the API now uses a more granular approach that only affects records that have been specifically marked as new, modified, or deleted.

## API Overview

### Endpoints

- `GET /api/contacts/[id]` - Get a specific contact by ID
- `PUT /api/contacts/[id]` - Update an existing contact
- `POST /api/contacts` - Create a new contact
- `DELETE /api/contacts/[id]` - Delete a contact

### Key Features

- **Granular Updates**: Only affected items are changed in the database
- **Flag-based Operations**: Items are marked with `isNew`, `isModified`, or `isDeleted` flags
- **Data Validation**: Both client-side and server-side validation ensures data integrity
- **Logging**: Detailed logging helps with troubleshooting and debugging

## CRUD Operations

### Create

When creating a new contact, all sections (basic info, emails, phone numbers, etc.) are created at once. Each record in multi-item sections should be marked with the `isNew` flag.

### Read

When fetching a contact, the API returns the contact's basic information along with all related data:
- Emails
- Phone numbers
- Addresses
- Social media accounts
- Tags

### Update

The update process is now more intelligent and precise:

1. Each item in multi-item sections is sent with a flag:
   - `isNew`: Brand new items to be inserted
   - `isModified`: Existing items that need updating
   - `isDeleted`: Items that should be removed

2. The server processes each item according to its flag:
   - New items are inserted
   - Modified items are updated
   - Deleted items are removed
   - Unchanged items are left alone

3. This approach prevents the "delete all and recreate" problem that previously caused data loss.

### Delete

When deleting a contact, all related records are deleted first, then the contact itself is removed.

## Data Structure

### Contact Basic Information

```typescript
{
  firstName: string;
  lastName: string;
  middleName?: string;
  genderId?: string;
  raceId?: string;
  pronouns?: string;
  vanid?: string;
  status: 'active' | 'inactive' | 'deceased' | 'moved';
}
```

### Email

```typescript
{
  id?: string; // Existing records have an ID
  email: string;
  status: 'active' | 'inactive' | 'bounced' | 'unsubscribed';
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}
```

### Phone Number

```typescript
{
  id?: string; // Existing records have an ID
  phone_number: string; // Client-side format (snake_case)
  phoneNumber: string; // Server-side format (camelCase)
  status: 'active' | 'inactive' | 'wrong number' | 'disconnected';
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}
```

### Address

```typescript
{
  id?: string; // Existing records have an ID
  street_address: string;
  secondary_street_address?: string;
  city: string;
  state_id: string;
  zip_code: string;
  status: 'active' | 'inactive' | 'moved' | 'wrong address';
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}
```

### Social Media Account

```typescript
{
  id?: string; // Existing records have an ID
  social_media_account: string;
  service_type: 'facebook' | 'twitter' | 'instagram' | 'threads' | 'tiktok' | 'bluesky' | 'youtube';
  status: 'active' | 'inactive' | 'blocked' | 'deleted';
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}
```

### Tags

Tags are handled differently as they are simple strings. The API compares existing tags with the new list and performs the minimal changes needed.

## UI Components

The following UI components have been updated to handle multiple records properly:

### ContactEmails.svelte
- Handles adding, updating, and removing email addresses
- Marks items with appropriate flags
- Validates email input

### ContactPhones.svelte
- Handles adding, updating, and removing phone numbers
- Marks items with appropriate flags
- Validates phone input

### ContactAddresses.svelte
- Handles adding, updating, and removing addresses
- Marks items with appropriate flags
- Validates address fields

### ContactSocialMedia.svelte
- Handles adding, updating, and removing social media accounts
- Marks items with appropriate flags
- Validates social media input

### ContactTags.svelte
- Handles adding and removing tags
- Uses a simpler model since tags are just strings

## Workflow Examples

### Adding a New Phone Number

1. User clicks "Add Phone" button in ContactPhones component
2. A new empty phone entry appears with `isNew: true` flag
3. User enters phone number and status
4. User saves the contact
5. The frontend filters changes and sends only the new phone number to the API
6. The API inserts the new phone number without affecting existing phone numbers
7. The updated contact is fetched with all phone numbers

### Updating an Existing Email

1. User changes the status of an existing email in ContactEmails component
2. The email is marked with `isModified: true` flag
3. User saves the contact
4. The frontend filters changes and sends only the modified email to the API
5. The API updates only this specific email
6. The updated contact is fetched with all emails

### Deleting an Address

1. User clicks the remove button on an address in ContactAddresses component
2. The address is marked with `isDeleted: true` flag
3. User saves the contact
4. The frontend filters changes and sends only the deleted address to the API
5. The API removes only this specific address
6. The updated contact is fetched with remaining addresses

## Best Practices

1. **Always Use Flags**: Make sure to mark items with the appropriate flags
   - `isNew`: For newly added items
   - `isModified`: For changed existing items
   - `isDeleted`: For items to be removed

2. **Validate Input**: Always validate input on both client and server:
   - Emails should be valid and not empty
   - Phone numbers should be properly formatted
   - Addresses should have required fields like street and city
   - Social media accounts should have both platform and username

3. **Handle IDs Properly**: 
   - New items won't have IDs
   - Existing items need IDs for updating or deleting
   - Always preserve IDs when modifying existing items

4. **Use Consistent Field Names**:
   - Client-side uses snake_case (e.g., `phone_number`)
   - API/server uses camelCase (e.g., `phoneNumber`)
   - Make sure to map between these formats correctly

5. **Filter Changes**: Only send changed items to reduce payload size and processing

6. **Use Debug Logging**: When troubleshooting, enable detailed logging on both client and server