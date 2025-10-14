# Donation API Integration

This document outlines the changes made to integrate the new Donation API endpoints into the Civics Lab application.

## Overview of Changes

We've updated several components to use the new API endpoints instead of direct Supabase calls:

1. **Main Donations Page**: Updated the `fetchDonations` function to use the new API endpoint
2. **Donation Form Modal**: Updated the form submission to use the new API endpoints
3. **Donation Details Sheet**: Updated to fetch and update donations through the API

## Components Updated

### 1. Main Donations Page (`/engage/donations/+page.svelte`)

- Replaced the Supabase query in `fetchDonations` with a fetch call to `/api/donations?workspace_id=...`
- Modified the data handling to accommodate the new API response format
- Added field name mapping to maintain compatibility with existing UI components

```javascript
// New fetchDonations function using API
async function fetchDonations() {
  if (!$workspaceStore.currentWorkspace) return;
  
  isLoadingDonations.set(true);
  donationsError.set(null);
  
  try {
    // Use the new API endpoint
    const response = await fetch(`/api/donations?workspace_id=${$workspaceStore.currentWorkspace.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Process response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch donations');
    }
    
    const data = await response.json();
    const fetchedDonations = data.donations || [];
    
    // Transform data for compatibility with existing code
    const formattedDonations = fetchedDonations.map(donation => ({
      id: donation.id,
      amount: donation.amount,
      status: donation.status,
      payment_type: donation.paymentType,
      notes: donation.notes,
      created_at: donation.createdAt,
      updated_at: donation.updatedAt,
      contact_id: donation.contactId,
      business_id: donation.businessId,
      contacts: donation.contact ? {
        id: donation.contact.id,
        first_name: donation.contact.firstName,
        last_name: donation.contact.lastName
      } : null,
      businesses: donation.business ? {
        id: donation.business.id,
        business_name: donation.business.businessName
      } : null
    }));
    
    donations.set(formattedDonations);
    // rest of function remains the same
  } catch (error) {
    // Error handling
  }
}
```

### 2. Donation Form Modal (`DonationFormModal.svelte`)

- Updated form submission to use context-specific endpoints
- Added proper error handling for API responses
- Maintained compatibility with existing tag functionality via Supabase

```javascript
async function handleSubmit() {
  // Validate form
  // ...
  
  try {
    // Prepare donation data
    const donationData = {
      amount: parseFloat($formData.amount),
      notes: $formData.notes || null,
      status: $formData.status,
      paymentType: $formData.paymentType || null
    };
    
    let response;
    
    // Use the appropriate API endpoint based on donor type
    if ($formData.donorType === 'person') {
      // Contact-specific donation endpoint
      response = await fetch(`/api/contacts/${$formData.contactId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData)
      });
    } else {
      // Business-specific donation endpoint
      response = await fetch(`/api/businesses/${$formData.businessId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData)
      });
    }
    
    // Process response and handle tags
    // ...
  } catch (err) {
    // Error handling
  }
}
```

### 3. Donation Details Sheet (`DonationDetailsSheet.svelte`)

- Updated `fetchDonationDetails` to use the `/api/donations/[id]` endpoint
- Updated `saveChanges` to use the PUT method for the same endpoint
- Modified data handling to work with the new API response format
- Added better error handling

#### Fetching Donation Details:

```javascript
async function fetchDonationDetails() {
  if (!donationId) return;
  
  isLoading.set(true);
  error.set(null);
  
  try {
    // Fetch donation details from the API
    const response = await fetch(`/api/donations/${donationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch donation');
    }
    
    const responseData = await response.json();
    const data = responseData.donation;
    
    // Process and display data
    // ...
  } catch (err) {
    // Error handling
  }
}
```

#### Saving Donation Changes:

```javascript
async function saveChanges() {
  if (!donationId) return;
  
  isSaving.set(true);
  error.set(null);
  
  try {
    // Update donation basic info if changed
    if (JSON.stringify($formData) !== JSON.stringify($originalData)) {
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
        body: JSON.stringify({ donationData })
      });
      
      // Process response
      // ...
    }
    
    // Handle tags (still using Supabase)
    // ...
  } catch (err) {
    // Error handling
  }
}
```

## Future Improvements

1. **Tag Management API**: Create API endpoints for donation tags to fully separate from Supabase
2. **Field Name Standardization**: Update the frontend to use camelCase consistently to match the API
3. **Error Handling**: Improve error handling with more specific error messages from the API
4. **Data Caching**: Implement caching for commonly accessed data to reduce API calls
5. **Pagination**: Add pagination support for large donation lists

## Testing Notes

- The donation listing now properly shows data from contacts and businesses
- Creating new donations for both contacts and businesses works correctly
- Updating donation details properly persists changes via the API
- Error handling has been improved throughout the application

## Migration Considerations

When migrating existing data, be aware of the following:

1. Field name changes (snake_case to camelCase)
2. The API now includes donor information in donation responses
3. Donation tags still use Supabase directly and will need migration in a future update
