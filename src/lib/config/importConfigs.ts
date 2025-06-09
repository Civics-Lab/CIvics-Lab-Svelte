import type { ImportConfig } from '$lib/types/import';

export const IMPORT_CONFIGS: Record<string, ImportConfig> = {
  contacts: {
    type: 'contacts',
    displayName: 'Contacts',
    description: 'Import individual people and their contact information',
    requiredFields: ['firstName', 'lastName'],
    optionalFields: [
      'middleName', 'genderId', 'raceId', 'pronouns', 'vanid',
      'emails', 'phoneNumbers', 'addresses', 'socialMediaAccounts', 'tags',
      // Individual address fields
      'streetAddress', 'secondaryStreetAddress', 'city', 'state', 'zipCode'
    ],
    validationRules: {
      firstName: { type: 'required', message: 'First name is required' },
      lastName: { type: 'required', message: 'Last name is required' },
      emails: { type: 'email', message: 'Invalid email format' },
      phoneNumbers: { type: 'phone', message: 'Invalid phone format' }
    },
    duplicateDetectionFields: ['emails', 'phoneNumbers', 'vanid'],
    relatedEntities: {
      gender: {
        table: 'genders',
        searchFields: ['gender'],
        createIfNotFound: false
      },
      race: {
        table: 'races',
        searchFields: ['race'],
        createIfNotFound: false
      }
    }
  },
  businesses: {
    type: 'businesses',
    displayName: 'Businesses',
    description: 'Import businesses and organizations',
    requiredFields: ['businessName'],
    optionalFields: [
      'status', 'phoneNumbers', 'addresses', 'socialMediaAccounts', 
      'employees', 'tags',
      // Individual address fields
      'streetAddress', 'secondaryStreetAddress', 'city', 'state', 'zipCode'
    ],
    validationRules: {
      businessName: { type: 'required', message: 'Business name is required' },
      phoneNumbers: { type: 'phone', message: 'Invalid phone format' }
    },
    duplicateDetectionFields: ['businessName', 'phoneNumbers'],
    relatedEntities: {
      employees: {
        table: 'contacts',
        searchFields: ['firstName', 'lastName', 'emails'],
        createIfNotFound: false
      }
    }
  },
  donations: {
    type: 'donations',
    displayName: 'Donations',
    description: 'Import donation records and amounts',
    requiredFields: ['amount'],
    optionalFields: ['contactId', 'businessId', 'status', 'paymentType', 'notes', 'donorEmail', 'donorName', 'businessName'],
    validationRules: {
      amount: { type: 'number', message: 'Amount must be a valid number', min: 0 },
      status: { 
        type: 'enum', 
        message: 'Invalid status',
        options: ['promise', 'donated', 'processing', 'cleared']
      },
      donorEmail: { type: 'email', message: 'Invalid donor email format' }
    },
    duplicateDetectionFields: ['contactId', 'businessId', 'amount'],
    relatedEntities: {
      contact: {
        table: 'contacts',
        searchFields: ['firstName', 'lastName', 'emails'],
        createIfNotFound: false
      },
      business: {
        table: 'businesses',
        searchFields: ['businessName'],
        createIfNotFound: false
      }
    }
  }
};

// Field display names for UI
export const FIELD_DISPLAY_NAMES: Record<string, Record<string, string>> = {
  contacts: {
    firstName: 'First Name',
    lastName: 'Last Name',
    middleName: 'Middle Name',
    genderId: 'Gender',
    raceId: 'Race',
    pronouns: 'Pronouns',
    vanid: 'VAN ID',
    emails: 'Email Addresses',
    phoneNumbers: 'Phone Numbers',
    addresses: 'Full Addresses (Combined)',
    streetAddress: 'Street Address',
    secondaryStreetAddress: 'Secondary Street Address',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP Code',
    socialMediaAccounts: 'Social Media',
    tags: 'Tags'
  },
  businesses: {
    businessName: 'Business Name',
    status: 'Status',
    phoneNumbers: 'Phone Numbers',
    addresses: 'Full Addresses (Combined)',
    streetAddress: 'Street Address',
    secondaryStreetAddress: 'Secondary Street Address',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP Code',
    socialMediaAccounts: 'Social Media',
    employees: 'Employees',
    tags: 'Tags'
  },
  donations: {
    amount: 'Amount',
    contactId: 'Contact ID',
    businessId: 'Business ID',
    status: 'Status',
    paymentType: 'Payment Type',
    notes: 'Notes',
    donorEmail: 'Donor Email',
    donorName: 'Donor Name',
    businessName: 'Business Name'
  }
};

// Field descriptions for tooltips/help
export const FIELD_DESCRIPTIONS: Record<string, Record<string, string>> = {
  contacts: {
    firstName: 'The contact\'s first name',
    lastName: 'The contact\'s last name',
    middleName: 'The contact\'s middle name or initial',
    genderId: 'Gender identity (must match existing gender options)',
    raceId: 'Race/ethnicity (must match existing race options)',
    pronouns: 'Preferred pronouns (e.g., he/him, she/her, they/them)',
    vanid: 'VAN (Voter Activation Network) ID number',
    emails: 'Email addresses (comma-separated for multiple)',
    phoneNumbers: 'Phone numbers (comma-separated for multiple)',
    addresses: 'Complete street addresses (comma-separated for multiple)',
    streetAddress: 'Primary street address (e.g., 123 Main St)',
    secondaryStreetAddress: 'Apartment, suite, or unit number',
    city: 'City name',
    state: 'State name or abbreviation',
    zipCode: 'ZIP or postal code',
    socialMediaAccounts: 'Social media handles (format: platform:handle)',
    tags: 'Labels or categories (comma-separated)'
  },
  businesses: {
    businessName: 'The official name of the business or organization',
    status: 'Business status (active, inactive, closed)',
    phoneNumbers: 'Business phone numbers (comma-separated for multiple)',
    addresses: 'Complete business addresses (comma-separated for multiple)',
    streetAddress: 'Primary business street address',
    secondaryStreetAddress: 'Suite, floor, or unit number',
    city: 'City where business is located',
    state: 'State where business is located',
    zipCode: 'Business ZIP or postal code',
    socialMediaAccounts: 'Social media accounts (format: platform:handle)',
    employees: 'Employee contact IDs or names (comma-separated)',
    tags: 'Business categories or labels (comma-separated)'
  },
  donations: {
    amount: 'Donation amount in dollars (e.g., 100.00)',
    contactId: 'ID of the contact who made the donation',
    businessId: 'ID of the business that made the donation',
    status: 'Donation status (promise, donated, processing, cleared)',
    paymentType: 'Method of payment (cash, check, credit card, etc.)',
    notes: 'Additional notes about the donation',
    donorEmail: 'Email address to find the donor contact',
    donorName: 'Full name to find the donor contact',
    businessName: 'Business name to find the donor business'
  }
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)\.]+$/,
  socialMedia: /^(facebook|twitter|bluesky|tiktok|instagram|threads|youtube):.+$/i
};

// Default values for enum fields
export const ENUM_DEFAULTS = {
  contactStatus: 'active',
  businessStatus: 'active',
  donationStatus: 'promise',
  socialMediaStatus: 'active',
  contactEmailStatus: 'active',
  contactPhoneStatus: 'active',
  contactAddressStatus: 'active'
};
