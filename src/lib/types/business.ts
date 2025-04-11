/**
 * Types for business-related data
 */

export interface BusinessPhone {
  id?: string;
  businessId: string;
  phoneNumber: string;
  status: 'active' | 'inactive' | 'wrong number' | 'disconnected';
  createdAt?: Date;
  updatedAt?: Date;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessAddress {
  id?: string;
  businessId: string;
  streetAddress: string;
  secondaryStreetAddress?: string;
  city: string;
  stateId: string;
  zipCodeId?: string;
  status: 'active' | 'inactive' | 'moved' | 'wrong address';
  createdAt?: Date;
  updatedAt?: Date;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessSocialMedia {
  id?: string;
  businessId: string;
  serviceType: 'facebook' | 'twitter' | 'bluesky' | 'tiktok' | 'instagram' | 'threads' | 'youtube';
  socialMediaAccount: string;
  status: 'active' | 'inactive' | 'blocked' | 'deleted';
  createdAt?: Date;
  updatedAt?: Date;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessEmployee {
  id?: string;
  businessId: string;
  contactId: string;
  contactName?: string; // For UI display purposes
  status: 'active' | 'inactive' | 'fired' | 'suspended';
  createdAt?: Date;
  updatedAt?: Date;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessTag {
  id?: string;
  businessId: string;
  tag: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Business {
  id: string;
  businessName: string;
  status: 'active' | 'inactive' | 'closed';
  workspaceId: string;
  createdAt?: Date;
  updatedAt?: Date;
  
  // Related data
  phoneNumbers?: BusinessPhone[];
  addresses?: BusinessAddress[];
  socialMediaAccounts?: BusinessSocialMedia[];
  employees?: BusinessEmployee[];
  tags?: BusinessTag[];
}

// Form-related types (for client-side use)
export interface BusinessPhoneForm {
  id?: string;
  phone_number: string;
  status: string;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessAddressForm {
  id?: string;
  street_address: string;
  secondary_street_address?: string;
  city: string;
  state_id: string;
  zip_code: string;
  status: string;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessSocialMediaForm {
  id?: string;
  social_media_account: string;
  service_type: string;
  status: string;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessEmployeeForm {
  id?: string;
  contact_id: string;
  contact_name?: string; // For display purposes
  status: string;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface BusinessFormData {
  business_name: string;
  status: string;
  phones: BusinessPhoneForm[];
  addresses: BusinessAddressForm[];
  socialMedia: BusinessSocialMediaForm[];
  employees: BusinessEmployeeForm[];
  tags: string[];
}
