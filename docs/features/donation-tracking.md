# Donation Tracking System Documentation

This document provides an overview of the donation tracking functionality implemented within the Civics Lab application.

## Table of Contents

1. [Overview](#overview)
2. [Database Structure](#database-structure)
3. [Component Structure](#component-structure)
4. [Contact Donations Implementation](#contact-donations-implementation)
5. [Business Donations Implementation](#business-donations-implementation)
6. [UI Components](#ui-components)
7. [Future Enhancements](#future-enhancements)

## Overview

The donation tracking system allows users to view and manage financial contributions from both individual contacts and businesses. The system provides:

- Comprehensive donation statistics
- Detailed donation history
- Status tracking for each donation
- Modal views for detailed donation information

## Database Structure

The donation system relies on the `donations` table which tracks contributions from contacts or businesses:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| contact_id | uuid | Foreign key to contacts table (nullable) |
| business_id | uuid | Foreign key to businesses table (nullable) |
| amount | numeric | Donation amount (required) |
| status | enum | Donation status (promise, donated, processing, cleared) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

The `donation_status` enum has the following options:
- `promise` - Donation has been pledged but not yet received
- `donated` - Donation has been received but not processed
- `processing` - Donation is being processed (e.g., check clearing)
- `cleared` - Donation has been fully processed and funds are available

## Component Structure

The donation functionality is implemented through two primary components:

1. `ContactDonations.svelte` - For displaying donations from individual contacts
2. `BusinessDonations.svelte` - For displaying donations from businesses

Both components are integrated into their respective detail sheets:
- `ContactDetailsSheet.svelte` - For contact details
- `BusinessDetailsSheet.svelte` - For business details

## Contact Donations Implementation

The `ContactDonations` component displays donation information for the currently selected contact in the contact details sheet.

### Features

- **Statistics Panel**: Shows four key metrics:
  - Total donation amount from this contact
  - Average donation amount
  - Total number of donations
  - Number and amount of donations this month

- **Donation History List**: Shows donation history with:
  - Amount (formatted as currency)
  - Date
  - Status (color-coded)

- **Donation Details Modal**: Opens when a donation is clicked, showing:
  - Amount
  - Date
  - Status
  - Donation ID
  - Creation and update timestamps

### Implementation Details

#### Component Setup and Props

```typescript
export let contactId: string;
export let supabase: TypedSupabaseClient;
export let isSaving: boolean = false;
```

#### State Management

The component uses Svelte stores to manage component state:

```typescript
const isLoading = writable(true);
const error = writable<string | null>(null);
const donations = writable<any[]>([]);
const totalDonationAmount = writable(0);
const averageDonationAmount = writable(0);
const donationsThisMonth = writable(0);
const donationsThisMonthAmount = writable(0);
const selectedDonation = writable<any>(null);
const showDonationModal = writable(false);
```

#### Data Fetching

Donations are fetched when the component mounts or when the contact ID changes:

```typescript
async function fetchDonations() {
  // ... implementation details ...
  const { data, error: fetchError } = await supabase
    .from('donations')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
  // ... process data and calculate statistics ...
}

// Reactive statement to trigger data fetch
$: if (contactId) {
  fetchDonations();
}
```

#### Calculated Statistics

The component calculates several metrics from the donation data:

- **Total Amount**: Sum of all donations
- **Average Amount**: Total amount divided by number of donations
- **This Month's Donations**: Filtered by current month and year

## Business Donations Implementation

The `BusinessDonations` component mirrors the functionality of the `ContactDonations` component but for business entities.

### Implementation Differences

The primary difference is in the data fetching function, which queries by business ID instead of contact ID:

```typescript
async function fetchDonations() {
  // ... implementation details ...
  const { data, error: fetchError } = await supabase
    .from('donations')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  // ... process data and calculate statistics ...
}
```

## UI Components

### Statistics Grid

The statistics grid shows four key metrics in a responsive layout:

```html
<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
  <!-- Total Amount -->
  <div class="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
    <p class="text-sm font-medium text-gray-500">Total Donations</p>
    <p class="mt-2 text-xl font-semibold text-gray-900">{formatCurrency($totalDonationAmount)}</p>
  </div>
  
  <!-- Additional metrics here... -->
</div>
```

### Donation List

The donation list displays each donation with key information:

```html
<div class="overflow-hidden border border-gray-200 sm:rounded-md">
  <ul class="divide-y divide-gray-200">
    {#each $donations as donation (donation.id)}
      <li 
        class="px-4 py-3 sm:px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        on:click={() => handleDonationClick(donation)}
      >
        <!-- Donation item content -->
      </li>
    {/each}
  </ul>
</div>
```

### Donation Details Modal

The modal displays detailed information for a selected donation:

```html
{#if $showDonationModal && $selectedDonation}
  <div class="fixed inset-0 z-[70] overflow-y-auto" on:click|stopPropagation={closeModal}>
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
        <!-- Modal content -->
      </div>
    </div>
  </div>
{/if}
```

### Status Styling

Donation statuses are visually differentiated with color-coded badges:

```html
<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 
  {donation.status === 'cleared' ? 'bg-green-100 text-green-800' : 
   donation.status === 'promise' ? 'bg-yellow-100 text-yellow-800' : 
   donation.status === 'donated' ? 'bg-blue-100 text-blue-800' : 
   donation.status === 'processing' ? 'bg-purple-100 text-purple-800' : 
   'bg-gray-100 text-gray-800'}">
  {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
</span>
```

## Utility Functions

The implementation includes several utility functions:

### Currency Formatting

```typescript
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
```

### Date Formatting

```typescript
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
```

## Integration with Details Sheets

The components are integrated into their respective detail sheets:

### Contact Details Sheet

```html
<!-- In ContactDetailsSheet.svelte -->
<!-- Donations Section -->
{#if contactId}
  <ContactDonations
    {contactId}
    {supabase}
    isSaving={$isSaving}
  />
{/if}
```

### Business Details Sheet

```html
<!-- In BusinessDetailsSheet.svelte -->
<!-- Donations Section -->
{#if businessId}
  <BusinessDonations
    {businessId}
    {supabase}
    isSaving={$isSaving}
  />
{/if}
```

## Future Enhancements

Potential future enhancements to the donation tracking system include:

1. **Donation Creation/Editing**: Allow users to create and edit donations directly from the detail sheets
2. **Advanced Filtering**: Filter donations by date range, amount range, or status
3. **Donation Reports**: Generate comprehensive reports for donation activities
4. **Graphs and Visualizations**: Visual representations of donation trends
5. **Recurring Donations**: Track and manage recurring donation pledges
6. **Payment Integration**: Direct integration with payment processors like Stripe
7. **Receipt Generation**: Create and send donation receipts to donors
8. **Tax Reporting**: Generate tax-related donation reports

These enhancements would build upon the current foundation to create a more comprehensive donation management system.
