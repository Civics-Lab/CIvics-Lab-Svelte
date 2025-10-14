# Donation Schema and API Updates

This document outlines the updates made to the donation schema and API to support additional donation fields and proper tag handling.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema Updates](#database-schema-updates)
3. [API Endpoint Updates](#api-endpoint-updates)
4. [Donation Details Implementation](#donation-details-implementation)
5. [Migration Strategy](#migration-strategy)
6. [Troubleshooting](#troubleshooting)

## Overview

The donation tracking system has been enhanced to support additional fields and proper tag handling. These updates ensure that donation details can be fully saved, including payment type, notes, and tags.

The main issues addressed by these updates were:
- Missing database columns for `payment_type` and `notes`
- Incomplete handling of tag updates
- SQL errors when trying to update donation details

## Database Schema Updates

### Updated Donations Table Schema

The `donations` table schema has been updated to include the following additional fields:

| Column | Type | Description |
|--------|------|-------------|
| payment_type | text | Type of payment (e.g., cash, check, credit card) |
| notes | text | Notes or additional information about the donation |

### Updated schema.ts Definition

```typescript
export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  amount: integer('amount').notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  businessId: uuid('business_id').references(() => businesses.id),
  status: donationStatusEnum('status').default('promise'),
  paymentType: text('payment_type'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### Donation Tags Table

The `donation_tags` table schema:

```typescript
export const donationTags = pgTable('donation_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  donationId: uuid('donation_id').references(() => donations.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
```

### Schema Relations

Relations have been updated to properly connect donations with their tags:

```typescript
export const donationsRelations = relations(donations, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [donations.contactId],
    references: [contacts.id]
  }),
  business: one(businesses, {
    fields: [donations.businessId],
    references: [businesses.id]
  }),
  tags: many(donationTags)
}));

export const donationTagsRelations = relations(donationTags, ({ one }) => ({
  donation: one(donations, {
    fields: [donationTags.donationId],
    references: [donations.id]
  })
}));
```

## API Endpoint Updates

### Enhanced Donation Detail Endpoint (GET)

The GET endpoint for retrieving a specific donation has been enhanced to include tag information:

```typescript
// GET /api/donations/[id]
export const GET: RequestHandler = async ({ params, locals }) => {
  // Authentication and access checks...
  
  try {
    // Get donation with access check
    const donation = await checkDonationAccess(user.id, donationId);
    
    // Fetch donor details (contact or business)
    let donorDetails = {};
    // ... (donor detail retrieval)
    
    // Get donation tags
    const tags = await db
      .select()
      .from(donationTags)
      .where(eq(donationTags.donationId, donationId));
    
    return json({
      donation: {
        ...donation,
        ...donorDetails,
        tags: tags || []
      }
    });
  } catch (err) {
    // Error handling...
  }
};
```

### Improved Donation Update Endpoint (PUT)

The PUT endpoint has been enhanced to handle both basic donation fields and tags:

```typescript
// PUT /api/donations/[id]
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  // Authentication and access checks...
  
  try {
    // Get donation with access check
    const donation = await checkDonationAccess(user.id, donationId);
    
    // Get update data from request
    const updateData = await request.json();
    const { donationData, tags } = updateData;
    
    // Update fields
    const updateFields: any = {};
    
    if (donationData.amount !== undefined && !isNaN(Number(donationData.amount))) {
      updateFields.amount = Number(donationData.amount);
    }
    
    if (donationData.status) {
      updateFields.status = donationData.status;
    }
    
    if (donationData.paymentType !== undefined) {
      updateFields.paymentType = donationData.paymentType;
    }
    
    if (donationData.notes !== undefined) {
      updateFields.notes = donationData.notes;
    }
    
    // Set updated timestamp
    updateFields.updatedAt = new Date();
    
    // Update the donation
    let updatedDonation;
    
    if (Object.keys(updateFields).length > 0) {
      [updatedDonation] = await db
        .update(donations)
        .set(updateFields)
        .where(eq(donations.id, donationId))
        .returning();
    } else {
      // If only updating tags, just get the current donation
      [updatedDonation] = await db
        .select()
        .from(donations)
        .where(eq(donations.id, donationId));
    }
    
    // Handle tag updates if provided
    if (tags) {
      // Get existing tags
      const existingTags = await db
        .select()
        .from(donationTags)
        .where(eq(donationTags.donationId, donationId));
      
      // Extract tag values
      const existingTagValues = existingTags.map(t => t.tag);
      
      // Find tags to add (in new list but not in existing)
      const tagsToAdd = tags.filter(tag => !existingTagValues.includes(tag));
      
      // Find tags to remove (in existing but not in new list)
      const tagsToRemove = existingTags.filter(existingTag => 
        !tags.includes(existingTag.tag)
      );
      
      // Add new tags
      if (tagsToAdd.length > 0) {
        await db.insert(donationTags).values(
          tagsToAdd.map(tag => ({
            donationId: donationId,
            tag: tag
          }))
        );
      }
      
      // Remove tags that are no longer needed
      if (tagsToRemove.length > 0) {
        for (const tagToRemove of tagsToRemove) {
          await db
            .delete(donationTags)
            .where(eq(donationTags.id, tagToRemove.id));
        }
      }
    }
    
    // Get updated tags
    const updatedTags = await db
      .select()
      .from(donationTags)
      .where(eq(donationTags.donationId, donationId));
    
    // Return updated donation with all related data
    return json({
      donation: {
        ...updatedDonation,
        ...donorDetails,
        tags: updatedTags || []
      }
    });
  } catch (err) {
    // Error handling...
  }
};
```

### Donation Deletion Endpoint (DELETE)

The DELETE endpoint now ensures tags are properly cleaned up:

```typescript
// DELETE /api/donations/[id]
export const DELETE: RequestHandler = async ({ params, locals }) => {
  // Authentication and access checks...
  
  try {
    // Check access
    await checkDonationAccess(user.id, donationId);
    
    // Delete tags first (though onDelete cascade should handle this)
    await db
      .delete(donationTags)
      .where(eq(donationTags.donationId, donationId));
    
    // Delete the donation
    await db
      .delete(donations)
      .where(eq(donations.id, donationId));
    
    return json({ success: true });
  } catch (err) {
    // Error handling...
  }
};
```

## Donation Details Implementation

### DonationDetailsSheet Component

The `DonationDetailsSheet.svelte` component has been enhanced to properly handle all donation fields:

```typescript
// Save changes function in DonationDetailsSheet.svelte
async function saveChanges() {
  if (!donationId) return;
  
  isSaving.set(true);
  error.set(null);
  
  try {
    // Prepare the update data in the format the API expects
    const donationData = {
      amount: Number($formData.amount) || 0,
      status: $formData.status || 'promise',
      paymentType: $formData.payment_type || '',
      notes: $formData.notes || ''
    };
    
    // Call the API to update the donation
    const response = await fetch(`/api/donations/${donationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        donationData,
        tags: $tags // Include tags in the update
      })
    });
    
    // Handle response...
  } catch (err) {
    // Error handling...
  }
}
```

## Migration Strategy

### Database Migration

A SQL migration file (`0003_donation_fields_update.sql`) has been created to add the missing columns to the existing database table:

```sql
-- Add missing fields to donations table
ALTER TABLE IF EXISTS "donations" 
ADD COLUMN IF NOT EXISTS "payment_type" text,
ADD COLUMN IF NOT EXISTS "notes" text;
```

### Direct Database Update Script

In addition to the standard migration, a direct database update script was created for more reliable execution:

```typescript
// src/lib/db/update-donations-table.ts
import 'dotenv/config';
import postgres from 'postgres';

// Get database connection string
const connectionString = process.env.DATABASE_URL;

async function main() {
  console.log('Starting direct table update...');
  
  const sql = postgres(connectionString, { ssl: 'require' });

  try {
    // Execute ALTER TABLE commands directly
    console.log('Adding payment_type column to donations table...');
    await sql`ALTER TABLE donations ADD COLUMN IF NOT EXISTS payment_type TEXT`;
    
    console.log('Adding notes column to donations table...');
    await sql`ALTER TABLE donations ADD COLUMN IF NOT EXISTS notes TEXT`;
    
    console.log('Table update completed successfully');
  } catch (error) {
    console.error('Table update failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await sql.end();
  }
}

main();
```

### Update Command

The direct update can be run with:

```bash
npm run db:update-donations
```

## Troubleshooting

### Common Issues

1. **"Column 'payment_type' does not exist" Error**:
   - This error occurs when the database schema is out of sync with the application code
   - Solution: Run `npm run db:update-donations` to add the missing columns

2. **Changes not saving**:
   - Check browser console for errors
   - Verify that all fields are properly named in both the frontend and backend
   - Ensure that the PUT endpoint is correctly processing all fields

3. **Tag updates not working**:
   - Ensure the donation_tags table exists
   - Check the frontend code is correctly sending tags in the update request
   - Verify that the API is processing tag additions and removals correctly

### Testing Update Success

After applying these updates, verify that:

1. You can create donations with payment type, notes, and tags
2. You can update all fields in a donation, including tags
3. The data persists and is retrieved correctly when you revisit a donation

If issues persist, check browser network requests and server logs for specific errors.
