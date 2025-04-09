# Database Handling Updates

This document details the updates to the database handling logic in the Civics Lab application, particularly focusing on the contact-related records.

## API Updates for Contact-Related Records

The API endpoints for managing contacts have been improved to handle related records more efficiently and prevent data loss. These changes primarily affect how the system interacts with the database.

### Before: Replace-All Approach

Previously, the system used a "replace-all" approach for contact-related records:

```typescript
// Delete existing phone numbers
await db
  .delete(contactPhoneNumbers)
  .where(eq(contactPhoneNumbers.contactId, contactId));

// Add new phone numbers
if (phoneNumbers.length > 0) {
  await db.insert(contactPhoneNumbers).values(
    phoneNumbers.map((phone) => ({
      contactId: contactId,
      phoneNumber: phone.phoneNumber,
      status: phone.status || 'active',
      createdById: user.id,
      updatedById: user.id,
    }))
  );
}
```

This approach had several limitations:
- All existing records would be deleted even when adding a single new record
- It was impossible to update just one record without affecting others
- Each update operation required sending all data, even unchanged data
- High risk of data loss if the client didn't send complete data

### After: Granular CRUD Operations

The updated system uses a more granular CRUD (Create, Read, Update, Delete) approach:

```typescript
// For each phone number, check if it's new, modified or deleted
for (const phone of validPhoneNumbers) {
  if (phone.isNew) {
    // Add new phone number
    await db.insert(contactPhoneNumbers).values({
      contactId: contactId,
      phoneNumber: phone.phoneNumber,
      status: phone.status || 'active',
      createdById: user.id,
      updatedById: user.id,
    });
  } else if (phone.isModified && phone.id) {
    // Update existing phone number
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
    await db
      .delete(contactPhoneNumbers)
      .where(eq(contactPhoneNumbers.id, phone.id));
  }
}
```

Key improvements:
- Each record is processed individually with appropriate operations
- Only necessary changes are applied to the database
- Existing records remain untouched when adding new ones
- Better handling of data validation and integrity

## Database Operations by Record Type

This granular CRUD approach was applied to all contact-related record types:

### Email Addresses

```typescript
// Handle emails: keep existing ones and add/update/delete as needed
if (emails) {
  // Filter out valid emails
  const validEmails = emails.filter(email => email.email && email.email.trim() !== '');
  
  if (validEmails.length > 0) {
    // For each email, check if it's new, modified or deleted
    for (const email of validEmails) {
      if (email.isNew) {
        // Add new email
        await db.insert(contactEmails).values({
          contactId: contactId,
          email: email.email,
          status: email.status || 'active',
          createdById: user.id,
          updatedById: user.id,
        });
      } else if (email.isModified && email.id) {
        // Update existing email
        await db
          .update(contactEmails)
          .set({
            email: email.email,
            status: email.status || 'active',
            updatedById: user.id,
            updatedAt: new Date(),
          })
          .where(eq(contactEmails.id, email.id));
      } else if (email.isDeleted && email.id) {
        // Delete email
        await db
          .delete(contactEmails)
          .where(eq(contactEmails.id, email.id));
      }
    }
  }
}
```

### Addresses

The address handling is more complex due to the relationship with zip codes:

```typescript
// Handle addresses: keep existing ones and add/update/delete as needed
if (addresses) {
  // Filter out valid addresses
  const validAddresses = addresses.filter(address => 
    address.streetAddress && address.streetAddress.trim() !== '' &&
    address.city && address.city.trim() !== '');
  
  if (validAddresses.length > 0) {
    // For each address, check if it's new, modified or deleted
    for (const address of validAddresses) {
      if (address.isDeleted && address.id) {
        // Delete address
        await db
          .delete(contactAddresses)
          .where(eq(contactAddresses.id, address.id));
      } else if (address.isNew || (address.isModified && address.id)) {
        // Handle zip code retrieval or creation
        let zipCodeId = address.zipCodeId;

        // If zipCodeId is not provided but zipCode is, find or create the zipCode
        if (!zipCodeId && address.zipCode) {
          // Find or create zip code logic...
        }

        if (address.isNew) {
          // Add new address
          await db.insert(contactAddresses).values({
            contactId: contactId,
            streetAddress: address.streetAddress,
            secondaryStreetAddress: address.secondaryStreetAddress || null,
            city: address.city,
            stateId: address.stateId,
            zipCodeId: zipCodeId,
            status: address.status || 'active',
            createdById: user.id,
            updatedById: user.id,
          });
        } else if (address.isModified && address.id) {
          // Update existing address
          await db
            .update(contactAddresses)
            .set({
              streetAddress: address.streetAddress,
              secondaryStreetAddress: address.secondaryStreetAddress || null,
              city: address.city,
              stateId: address.stateId,
              zipCodeId: zipCodeId,
              status: address.status || 'active',
              updatedById: user.id,
              updatedAt: new Date(),
            })
            .where(eq(contactAddresses.id, address.id));
        }
      }
    }
  }
}
```

### Social Media Accounts

```typescript
// Handle social media accounts: keep existing ones and add/update/delete as needed
if (socialMedia) {
  // Filter out valid social media accounts
  const validSocialMedia = socialMedia.filter(account => 
    account.socialMediaAccount && account.socialMediaAccount.trim() !== '' &&
    account.serviceType);
  
  if (validSocialMedia.length > 0) {
    // For each social media account, check if it's new, modified or deleted
    for (const account of validSocialMedia) {
      if (account.isNew) {
        // Add new social media account
        await db.insert(contactSocialMediaAccounts).values({
          contactId: contactId,
          serviceType: account.serviceType,
          socialMediaAccount: account.socialMediaAccount,
          status: account.status || 'active',
          createdById: user.id,
          updatedById: user.id,
        });
      } else if (account.isModified && account.id) {
        // Update existing social media account
        await db
          .update(contactSocialMediaAccounts)
          .set({
            serviceType: account.serviceType,
            socialMediaAccount: account.socialMediaAccount,
            status: account.status || 'active',
            updatedById: user.id,
            updatedAt: new Date(),
          })
          .where(eq(contactSocialMediaAccounts.id, account.id));
      } else if (account.isDeleted && account.id) {
        // Delete social media account
        await db
          .delete(contactSocialMediaAccounts)
          .where(eq(contactSocialMediaAccounts.id, account.id));
      }
    }
  }
}
```

### Tags

For tags, a different approach was used due to their simpler structure:

```typescript
// Handle tags specially: compare existing vs new tags and make minimal changes
if (tags) {
  // Get existing tags
  const existingTags = await db
    .select()
    .from(contactTags)
    .where(
      and(
        eq(contactTags.contactId, contactId),
        eq(contactTags.workspaceId, contact.workspaceId)
      )
    );
  
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
    await db.insert(contactTags).values(
      tagsToAdd.map(tag => ({
        contactId: contactId,
        workspaceId: contact.workspaceId,
        tag: tag,
      }))
    );
  }
  
  // Remove tags that are no longer needed
  if (tagsToRemove.length > 0) {
    for (const tagToRemove of tagsToRemove) {
      await db
        .delete(contactTags)
        .where(eq(contactTags.id, tagToRemove.id));
    }
  }
}
```

## Data Models and Field Mapping

The updated system maintains consistency between the frontend and API data models through careful field mapping:

### Frontend Model (UI Components)

Using snake_case for field names:
```typescript
{
  id: string,
  phone_number: string,
  status: string,
  isNew?: boolean,
  isModified?: boolean,
  isDeleted?: boolean
}
```

### API Model (contactService.ts)

Map frontend snake_case to backend camelCase:
```typescript
{
  id: string,
  phoneNumber: string, // Mapped from phone_number
  status: string,
  isNew?: boolean,
  isModified?: boolean,
  isDeleted?: boolean
}
```

### Database Model (Drizzle Schema)

```typescript
export const contactPhoneNumbers = pgTable('contact_phone_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id),
  phoneNumber: text('phone_number').notNull(),
  status: contactPhoneStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id),
  updatedById: uuid('updated_by').references(() => users.id)
});
```

## Data Validation Improvements

The updates include improved data validation at multiple levels:

1. **UI Components**: 
   - Input fields trim and validate values
   - Empty inputs are converted to empty strings rather than null

2. **Service Layer**:
   - Filters out invalid records before sending to API
   - Ensures phone numbers, emails, etc. are properly formatted

3. **API Endpoints**:
   - Validates incoming data before database operations
   - Converts empty strings to null where appropriate in database

This multi-layered validation approach ensures data integrity and prevents common errors such as:
- Null values in required fields
- Empty strings in non-string fields
- Invalid formats for emails, phone numbers, etc.

## Database Performance Improvements

The granular CRUD approach offers several performance benefits:

1. **Reduced Database Operations**:
   - Only necessary records are modified
   - Batch operations are used where appropriate

2. **More Efficient Transactions**:
   - Smaller, targeted changes reduce transaction scope
   - Better use of database resources

3. **Optimized Query Patterns**:
   - Direct updates and deletes instead of delete-all-then-recreate
   - Better use of indexes and primary keys

These improvements result in faster response times, especially for contacts with many related records, and reduce the risk of data loss or corruption.
