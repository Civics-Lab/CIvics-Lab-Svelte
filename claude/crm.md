# Civics Lab CRM System Documentation

This document provides a comprehensive overview of the Customer Relationship Management (CRM) portion of the Civics Lab application, which is located in the `/engage` route.

For detailed information on the contact management system's API and interface updates, see the [CRM Updates Documentation](crm-updates.md) and [Database Updates Documentation](database-updates.md).

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Features](#key-features)
4. [Dashboard](#dashboard)
5. [Contact Management](#contact-management)
6. [Business Management](#business-management)
7. [Donation Tracking](#donation-tracking)
8. [Settings](#settings)
9. [Workflow](#workflow)
10. [UI Components](#ui-components)
11. [Known Issues and Fixes](#known-issues-and-fixes)

## Overview

The CRM system in Civics Lab provides a comprehensive suite of tools for managing relationships with individuals and organizations involved in civic engagement activities. The system is designed to help users organize, track, and nurture relationships with constituents, stakeholders, businesses, and donors.

The CRM is a central component of the Civics Lab platform, providing features for:

- Managing individual contacts with detailed information
- Tracking businesses and organizations
- Recording and managing donations
- Creating custom views and filters for data
- Organizing data with tags and categories
- Managing workspaces for team collaboration

## Architecture

The CRM system follows a modular architecture with several interconnected components:

### Route Structure

```
/engage/
├── +layout.svelte       # Main layout with navigation sidebar
├── +page.svelte         # Dashboard overview
├── contacts/            # Contact management
├── businesses/          # Business management
├── donations/           # Donation tracking
└── settings/            # System configuration
    ├── account/         # User account settings
    └── workspace/       # Workspace configuration
```

### Data Flow

1. User authentication and workspace selection
2. Data fetching from Supabase backend
3. State management through Svelte stores
4. Component rendering based on route
5. User interactions trigger Supabase operations
6. Real-time updates through reactive state management

## Key Features

### Workspace Management

- Multi-workspace support for different campaigns or projects
- User roles and permissions within workspaces
- Workspace-specific data isolation

### Contact & Business Management

- Comprehensive contact and business profiles
- Multi-channel communication tracking (email, phone, social media)
- Address management with location data
- Tagging and categorization system
- Custom views and filters

### Donation Tracking

- Record and manage donations from individuals and businesses
- Track donation status (promised, received, processed)
- Donation reporting and analysis

## Dashboard

The CRM dashboard (`/engage/+page.svelte`) serves as the central hub for users to access key information and functionality.

### Dashboard Features

- Overview of key metrics (contacts, businesses, donations)
- Quick action buttons for common tasks
- Recent activity feed
- Workspace context and selection

### Dashboard Components

- Metric cards displaying counts and totals
- Quick action buttons for creating new records
- Workspace selection dropdown
- Status indicators for system health

## Contact Management

The contact management system (`/engage/contacts`) provides comprehensive tools for managing individual relationships. The system uses a granular CRUD approach to manage related records, allowing multiple phone numbers, emails, addresses, and social media accounts for each contact.

### Contact Data Model

- Basic information (name, gender, race, pronouns)
- Multiple contact methods (emails, phones, addresses)
- Social media accounts
- Custom tags
- VAN ID for voter activation network integration
- Status tracking (active, inactive, deceased, moved)

### Contact UI Components

- `ContactsDataGrid.svelte`: Main list view with filtering and sorting
- `ContactDetailsSheet.svelte`: Slide-in panel for viewing and editing details
- `ContactFormModal.svelte`: Modal form for creating new contacts
- `ContactsFilterSortBar.svelte`: Controls for filtering and sorting the list
- `ContactsViewModals.svelte`: Modals for managing saved views
- `ContactsViewNavbar.svelte`: Navigation for switching between views

### Contact Operations

- Create, read, update, delete (CRUD) operations
- Import and export functionality
- Bulk operations
- Advanced filtering and searching
- Custom view creation and management

## Business Management

The business management system (`/engage/businesses`) provides tools for tracking organizations and their relationships.

### Business Data Model

- Basic information (business name, status)
- Multiple locations (addresses)
- Contact methods (phone numbers)
- Social media accounts
- Employee relationships (linked to contacts)
- Custom tags

### Business UI Components

- `BusinessesDataGrid.svelte`: Main list view with filtering and sorting
- `BusinessDetailsSheet.svelte`: Slide-in panel for viewing and editing details
- `BusinessFormModal.svelte`: Modal form for creating new businesses
- `BusinessesFilterSortBar.svelte`: Controls for filtering and sorting the list
- `BusinessesViewModals.svelte`: Modals for managing saved views
- `BusinessesViewNavbar.svelte`: Navigation for switching between views

### Business Operations

- Create, read, update, delete (CRUD) operations
- Employee relationship management
- Location tracking
- Custom view creation and management

## Donation Tracking

The donation tracking system (`/engage/donations`) allows users to record and manage financial contributions.

### Donation Data Model

- Donor information (linked to contacts or businesses)
- Amount and currency
- Status tracking (promise, donated, processing, cleared)
- Timestamp information

### Donation UI Components

- `ContactDonations.svelte`: Displays donation information in the contact details sheet
- `BusinessDonations.svelte`: Displays donation information in the business details sheet
- `DonationFormModal.svelte`: Modal form for recording donations

For more detailed information on the donation tracking system, see the [Donation Tracking Documentation](donation-tracking.md).

### Donation Operations

- Recording new donations
- Updating donation status
- Donation reporting and analysis
- Donor relationship tracking

## Settings

The settings area (`/engage/settings`) provides configuration options for the CRM system.

### Account Settings

- User profile management
- Personal preferences
- Account security settings

### Workspace Settings

- Workspace configuration
- User invitation and management
- Role assignments
- Subscription and billing management

## Workflow

### Contact Management Workflow

1. Create a new contact using the contact form
2. Record contact details including:
   - Basic personal information
   - Contact methods (email, phone)
   - Address information
   - Social media accounts
   - Custom tags
3. View and manage contacts in the contacts list
4. Filter and sort contacts based on criteria
5. Create custom views for specific groups or segments
6. Edit contact details as needed
7. Track status changes
8. Record donations from contacts

### Business Management Workflow

1. Create a new business using the business form
2. Record business details including:
   - Business name and status
   - Location information
   - Contact numbers
   - Social media accounts
   - Employee relationships
   - Custom tags
3. View and manage businesses in the business list
4. Filter and sort businesses based on criteria
5. Create custom views for specific groups or segments
6. Edit business details as needed
7. Track status changes
8. Record donations from businesses

## UI Components

### Common Components

- `Modal.svelte`: Reusable modal dialog component
- `LoadingSpinner.svelte`: Loading indicator for async operations
- `ToastContainer.svelte`: Notification system for user feedback
- `WorkspaceSelector.svelte`: Dropdown for workspace selection
- `WorkspaceContext.svelte`: Context provider for workspace data

### Contact Detail Components

Several specialized components make up the contact details view:

- `ContactBasicInfo.svelte`: Basic contact information fields
- `ContactEmails.svelte`: Email management section
- `ContactPhones.svelte`: Phone number management section
- `ContactAddresses.svelte`: Address management section
- `ContactSocialMedia.svelte`: Social media account management
- `ContactTags.svelte`: Tag management section

### Data Grid Components

The data grid components provide list views with advanced features:

- Column customization
- Sorting by multiple fields
- Filtering by multiple criteria
- Row selection for bulk operations
- Pagination controls
- View management

## Data Synchronization

The CRM system uses Supabase real-time capabilities to ensure data consistency:

1. All changes are immediately persisted to the database
2. State is managed in Svelte stores for reactive updates
3. UI components reflect the latest data state
4. Optimistic UI updates provide immediate feedback
5. Error handling mechanisms recover from failures

## User Experience Considerations

The CRM system is designed with the following UX principles:

1. **Progressive Disclosure**: Complex features are revealed gradually
2. **Contextual Actions**: Actions are presented where relevant
3. **Consistent Navigation**: Sidebar provides persistent navigation
4. **Status Feedback**: Toast notifications and loading indicators keep users informed
5. **Responsive Design**: Adapts to different screen sizes
6. **Error Recovery**: Validation and error handling prevent data loss
7. **Workspace Context**: All operations occur within the selected workspace

## Integration Points

The CRM system integrates with other parts of the Civics Lab application:

1. **Authentication System**: User identity and permissions
2. **Workspace System**: Data organization and access control
3. **Notification System**: User alerts and updates
4. **Analytics**: Usage tracking and reporting

This CRM system provides a robust foundation for civic engagement organizations to manage their relationships with constituents, businesses, and donors in an organized and efficient manner.

## Known Issues and Fixes

### Multiple Contact-Related Records Issue

**Issue**: The contact management system only showed one phone number, email, address, or social media account per contact. When adding a new item, it would replace any existing ones instead of adding to the collection.

**Root Cause**: The backend API was using a "replace-all" approach for contact-related records. When updating, it would first delete all existing records (e.g., phone numbers) for a contact and then insert all new ones. This meant when adding a new phone number, all existing phone numbers would be deleted and only the new one would remain.

**Fix Implementation**:

1. Updated the API endpoint (`PUT /api/contacts/[id]`) to handle contact-related records individually with a granular CRUD approach:
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

2. Updated all contact detail components to properly mark items with `isNew`, `isModified`, or `isDeleted` flags

3. Enhanced input validation to prevent nulls and properly format data

4. Improved the service layer (`contactService.ts`) to preserve necessary flags and IDs when sending data to the API

This fix enables users to add multiple phone numbers, email addresses, addresses, and social media accounts to a contact without losing existing data.

For complete implementation details, see the [CRM Updates Documentation](crm-updates.md) and [Database Updates Documentation](database-updates.md).

### Business Form Modal Structure Error

**Issue**: The `/engage/businesses` route displayed an error related to the `BusinessFormModal.svelte` component:
```
[plugin:vite-plugin-svelte] src/lib/components/businesses/BusinessFormModal.svelte:387:22 `</button>` attempted to close an element that was not open
https://svelte.dev/e/element_invalid_closing_tag
```

**Root Cause**: The component had structural issues in its HTML markup, particularly in the phone numbers section. The HTML was malformed with inconsistent opening and closing tags. Additionally, there were references to undefined variables (`$phones` and `$addresses`) that should have been using `$formData.phones` and `$formData.addresses`. The component also referenced functions (`addPhone`, `removePhone`, `addAddress`, `removeAddress`) that weren't properly defined in the script section.

**Fix Implementation**:

1. Corrected all HTML structure issues to ensure properly matched opening and closing tags
2. Changed references from `$phones` and `$addresses` to use `$formData.phones` and `$formData.addresses` consistently
3. Added explicit implementations for the missing functions:
   ```typescript
   function addPhone() {
     $formData.phones = [...$formData.phones, { phone_number: '', is_primary: false, status: 'active' }];
   }
   
   function removePhone(index: number) {
     $formData.phones = $formData.phones.filter((_, i) => i !== index);
   }
   
   function addAddress() {
     $formData.addresses = [...$formData.addresses, {
       street_address: '',
       secondary_street_address: '',
       city: '',
       state_id: '',
       zip_code: '',
       is_primary: false,
       status: 'active'
     }];
   }
   
   function removeAddress(index: number) {
     $formData.addresses = $formData.addresses.filter((_, i) => i !== index);
   }
   ```
4. Ensured consistent data structure for all objects by adding any missing properties like `status`
5. Added screen reader accessible text for better accessibility

**Debugging Approach**:
1. Identified the exact location of the error at line 387 
2. Analyzed the surrounding HTML structure to identify unmatched tags
3. Examined variable references to identify undefined or incorrectly referenced variables
4. Detected missing function definitions that were being referenced
5. Created a complete, corrected version of the component that fixed all structural issues

This fix resolves the HTML parsing error and ensures proper functionality for adding, editing, and removing phone numbers and addresses in the business form modal.

### View Name Editing Issue

**Issue**: When editing the name of a view in the contacts portion of the CRM, the application showed a success message but didn't update the database or refresh the view list.

**Root Cause**: The issue was in the event handling and data processing between the `ContactsViewModals.svelte` component and the main `+page.svelte` component in the contacts route. The event detail containing the new view name wasn't being properly processed before being sent to Supabase.

**Fix Implementation**:

1. The `updateView` function in `src/routes/engage/contacts/+page.svelte` was enhanced to:
   - Better handle the event data from the modal component
   - Provide more robust error handling with detailed logging
   - Ensure consistency between local state and database
   - Return the updated data from Supabase using `.select()`
   - Properly refresh views from the database after an update

2. The update event handler in `ContactsViewModals.svelte` was improved to ensure proper data transmission.

**Code Changes**:

```javascript
// Updated updateView function
async function updateView(event) {
  if (!$currentView) {
    console.error('No current view to update');
    return;
  }
  
  try {
    let updatedViewName = '';
    
    // Determine the new view name
    if (event && event.detail) {
      // Get name from event if available
      updatedViewName = event.detail.trim();
    } else if ($isEditViewModalOpen && $newViewName.trim()) {
      // Get name from store if modal is open
      updatedViewName = $newViewName.trim();
    } else {
      // Fallback to current name
      updatedViewName = $currentView.view_name;
    }
    
    // Create updated view object
    const updatedView = {
      ...$currentView,
      view_name: updatedViewName,
      filters: $filters,
      sorting: $sorting
    };
    
    // Update in Supabase
    const { data: updatedData, error } = await data.supabase
      .from('contact_views')
      .update(updatedView)
      .eq('id', $currentView.id)
      .select();
    
    if (error) throw error;
    
    // Update views in local state and refresh from database
    views.update(viewsList => 
      viewsList.map(view => view.id === $currentView.id 
        ? updatedView 
        : view
      )
    );
    
    currentView.set(updatedView);
    toastStore.success('View updated successfully');
    
    // Refresh views from database to ensure consistency
    await fetchViews($currentView.id);
  } catch (error) {
    console.error('Error updating view:', error);
    toastStore.error('Failed to update view: ' + (error.message || 'Unknown error'));
  }
}
```

**Debugging Techniques**:
- Added detailed console logging throughout the update process
- Ensured proper error handling with specific error messages
- Verified database operations by checking Supabase return values
- Added additional validation to prevent updates with invalid data

This fix ensures that view name edits are properly persisted to the database and reflected in the UI, maintaining data consistency throughout the application.
