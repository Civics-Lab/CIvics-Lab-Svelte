# Donation API Documentation

This document provides detailed information about the Donation API in the Civics Lab SvelteKit application.

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

The Donation API is designed to handle donation data for both contacts and businesses. The API provides endpoints for creating, reading, updating, and deleting donations, as well as fetching donations by contact or business.

## API Overview

### Endpoints

#### Main Donation Endpoints
- `GET /api/donations?workspace_id=[workspace_id]` - Get all donations for a workspace
- `GET /api/donations/[id]` - Get a specific donation by ID
- `POST /api/donations` - Create a new donation
- `PUT /api/donations/[id]` - Update an existing donation
- `DELETE /api/donations/[id]` - Delete a donation

#### Contact-Specific Endpoints
- `GET /api/contacts/[id]/donations` - Get all donations for a specific contact
- `POST /api/contacts/[id]/donations` - Create a new donation for a specific contact

#### Business-Specific Endpoints
- `GET /api/businesses/[id]/donations` - Get all donations for a specific business
- `POST /api/businesses/[id]/donations` - Create a new donation for a specific business

### Key Features

- **Donor Association**: Each donation is associated with either a contact or a business (not both)
- **Detailed Responses**: API responses include donor information (contact or business details)
- **Access Control**: Proper authorization checks for workspace access
- **Data Validation**: Both client-side and server-side validation ensures data integrity

## CRUD Operations

### Create

There are three ways to create a donation:

1. **Direct creation with donor information**:
```typescript
// POST /api/donations
{
  "amount": 100,
  "status": "promise",
  "contactId": "contact-uuid", // OR businessId, not both
  "notes": "Annual donation",
  "paymentType": "check"
}
```

2. **Creation for a specific contact**:
```typescript
// POST /api/contacts/[contact-id]/donations
{
  "amount": 100,
  "status": "promise",
  "notes": "Annual donation",
  "paymentType": "check"
}
```

3. **Creation for a specific business**:
```typescript
// POST /api/businesses/[business-id]/donations
{
  "amount": 100,
  "status": "promise",
  "notes": "Corporate sponsorship",
  "paymentType": "wire"
}
```

### Read

#### Get All Donations for a Workspace
```typescript
// GET /api/donations?workspace_id=[workspace-id]
// Response:
{
  "donations": [
    {
      "id": "donation-uuid",
      "amount": 100,
      "status": "donated",
      "notes": "Annual donation",
      "paymentType": "check",
      "contactId": "contact-uuid",
      "businessId": null,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "contact": {
        "id": "contact-uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    {
      "id": "donation-uuid-2",
      "amount": 500,
      "status": "promise",
      "notes": "Corporate sponsorship",
      "paymentType": "wire",
      "contactId": null,
      "businessId": "business-uuid",
      "createdAt": "2023-01-02T00:00:00.000Z",
      "updatedAt": "2023-01-02T00:00:00.000Z",
      "business": {
        "id": "business-uuid",
        "businessName": "Acme Corp"
      }
    }
  ]
}
```

#### Get a Specific Donation
```typescript
// GET /api/donations/[id]
// Response:
{
  "donation": {
    "id": "donation-uuid",
    "amount": 100,
    "status": "donated",
    "notes": "Annual donation",
    "paymentType": "check",
    "contactId": "contact-uuid",
    "businessId": null,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "contact": {
      "id": "contact-uuid",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

#### Get Donations for a Contact
```typescript
// GET /api/contacts/[id]/donations
// Response:
{
  "donations": [
    {
      "id": "donation-uuid",
      "amount": 100,
      "status": "donated",
      "notes": "Annual donation",
      "paymentType": "check",
      "contactId": "contact-uuid",
      "businessId": null,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "contact": {
        "id": "contact-uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

#### Get Donations for a Business
```typescript
// GET /api/businesses/[id]/donations
// Response:
{
  "donations": [
    {
      "id": "donation-uuid-2",
      "amount": 500,
      "status": "promise",
      "notes": "Corporate sponsorship",
      "paymentType": "wire",
      "contactId": null,
      "businessId": "business-uuid",
      "createdAt": "2023-01-02T00:00:00.000Z",
      "updatedAt": "2023-01-02T00:00:00.000Z",
      "business": {
        "id": "business-uuid",
        "businessName": "Acme Corp"
      }
    }
  ]
}
```

### Update

When updating a donation, use the following format:

```typescript
// PUT /api/donations/[id]
{
  "donationData": {
    "amount": 150,
    "status": "cleared",
    "notes": "Updated annual donation",
    "paymentType": "credit card"
  }
}
```

The API will:
- Validate the input data
- Update only the provided fields
- Return the updated donation with donor information

**Important**: You cannot change a donation from a contact to a business or vice versa. If you need to do this, delete the existing donation and create a new one.

### Delete

To delete a donation:

```typescript
// DELETE /api/donations/[id]
// No request body needed
// Response on success:
{
  "success": true
}
```

## Data Structure

### Donation Basic Information

```typescript
{
  id: string; // UUID
  amount: number; // Amount in dollars or cents (consistent throughout)
  status: 'promise' | 'donated' | 'processing' | 'cleared';
  notes?: string; // Optional notes about the donation
  paymentType?: string; // Method of payment (check, cash, credit card, etc.)
  contactId?: string; // UUID of the associated contact (null for business donations)
  businessId?: string; // UUID of the associated business (null for contact donations)
  createdAt: Date;
  updatedAt: Date;
}
```

## Best Practices

1. **Validate Input**: Always validate input on both client and server:
   - Amount should be a valid number
   - Status should be one of the allowed values
   - Either contactId or businessId should be provided (not both)

2. **Handle Errors**: Proper error handling with meaningful error messages:
   - 400 for invalid input data
   - 401 for unauthenticated requests
   - 403 for unauthorized access
   - 404 for not found resources
   - 500 for server errors

3. **Include Donor Information**: When displaying donations, always include basic donor information:
   - For contacts: First name, last name
   - For businesses: Business name

4. **Workspace Context**: Always operate within the context of a workspace:
   - When fetching donations for a workspace, only show donations from contacts and businesses in that workspace
   - Verify workspace access before allowing operations

5. **Update Format**: When updating donations, use the `donationData` object format for consistency with other APIs:
```typescript
{
  "donationData": {
    "amount": 150,
    "status": "cleared"
  }
}
```

6. **Authorization**: Always check if the user has access to the workspace before performing any operation.

7. **Performance**: When fetching large lists of donations, consider:
   - Pagination
   - Filtering options
   - Sorting options
