# Business API Documentation

This document provides detailed information about the Business API in the Civics Lab SvelteKit application, with a focus on how data is handled for multiple related records like phone numbers, addresses, employees, and social media accounts.

## Table of Contents
- [Introduction](#introduction)
- [API Overview](#api-overview)
- [CRUD Operations](#crud-operations)
  - [Create](#create)
  - [Read](#read)
  - [Update](#update)
  - [Delete](#delete)
- [Data Structure](#data-structure)
- [Best Practices](#best-practices)

## Introduction

The Business API is designed to handle business data with multiple related records. Instead of replacing all related records when one changes, the API uses a more granular approach that only affects records that have been specifically marked as new, modified, or deleted.

## API Overview

### Endpoints

- `GET /api/businesses?workspace_id=[workspace_id]` - Get all businesses for a workspace
- `GET /api/businesses/[id]` - Get a specific business by ID
- `POST /api/businesses` - Create a new business
- `PUT /api/businesses/[id]` - Update an existing business
- `DELETE /api/businesses/[id]` - Delete a business

### Key Features

- **Granular Updates**: Only affected items are changed in the database
- **Flag-based Operations**: Items are marked with `isNew`, `isModified`, or `isDeleted` flags
- **Data Validation**: Both client-side and server-side validation ensures data integrity
- **Logging**: Detailed logging helps with troubleshooting and debugging

## CRUD Operations

### Create

When creating a new business, all sections (basic info, phone numbers, etc.) are created at once. Each record in multi-item sections should be marked with the `isNew` flag.

```typescript
// Example request for creating a new business
{
  "workspaceId": "workspace-uuid",
  "business": {
    "businessName": "Acme Corp",
    "status": "active"
  },
  "phoneNumbers": [
    {
      "phoneNumber": "555-123-4567",
      "status": "active"
    }
  ],
  "addresses": [
    {
      "streetAddress": "123 Main St",
      "city": "Anytown",
      "stateId": "state-uuid",
      "zipCode": "12345",
      "status": "active"
    }
  ],
  "socialMedia": [
    {
      "socialMediaAccount": "acmecorp",
      "serviceType": "twitter",
      "status": "active"
    }
  ],
  "employees": [
    {
      "contactId": "contact-uuid",
      "status": "active"
    }
  ],
  "tags": ["local", "tech"]
}
```

### Read

When fetching a business, the API returns the business's basic information along with all related data:
- Phone numbers
- Addresses
- Social media accounts
- Employees
- Tags

```typescript
// Example response from GET /api/businesses/[id]
{
  "business": {
    "id": "business-uuid",
    "businessName": "Acme Corp",
    "status": "active",
    "workspaceId": "workspace-uuid",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "phoneNumbers": [...],
    "addresses": [...],
    "socialMediaAccounts": [...],
    "employees": [...],
    "tags": [...]
  }
}
```

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

```typescript
// Example request for updating a business
{
  "businessData": {
    "businessName": "Acme Corporation",
    "status": "active"
  },
  "phoneNumbers": [
    {
      "id": "phone-uuid",
      "phoneNumber": "555-123-4567",
      "status": "active",
      "isModified": true
    },
    {
      "phoneNumber": "555-987-6543",
      "status": "active",
      "isNew": true
    },
    {
      "id": "phone-to-delete-uuid",
      "isDeleted": true
    }
  ],
  // ... similar patterns for addresses, socialMedia, employees, and tags
}
```

### Delete

When deleting a business, all related records are deleted first, then the business itself is removed.

## Data Structure

### Business Basic Information

```typescript
{
  businessName: string;
  status: 'active' | 'inactive' | 'closed';
}
```

### Phone Number

```typescript
{
  id?: string; // Existing records have an ID
  phoneNumber: string;
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
  streetAddress: string;
  secondaryStreetAddress?: string;
  city: string;
  stateId: string;
  zipCode: string; // This is stored as zipCodeId in the database
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
  socialMediaAccount: string;
  serviceType: 'facebook' | 'twitter' | 'instagram' | 'threads' | 'tiktok' | 'bluesky' | 'youtube';
  status: 'active' | 'inactive' | 'blocked' | 'deleted';
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}
```

### Employee

```typescript
{
  id?: string; // Existing records have an ID
  contactId: string;
  status: 'active' | 'inactive' | 'fired' | 'suspended';
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}
```

### Tags

Tags are handled differently as they are simple strings. The API compares existing tags with the new list and performs the minimal changes needed.

## Best Practices

1. **Always Use Flags**: Make sure to mark items with the appropriate flags
   - `isNew`: For newly added items
   - `isModified`: For changed existing items
   - `isDeleted`: For items to be removed

2. **Validate Input**: Always validate input on both client and server:
   - Phone numbers should be properly formatted
   - Addresses should have required fields like street and city
   - Social media accounts should have both platform and username
   - Employees should have valid contact IDs

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
