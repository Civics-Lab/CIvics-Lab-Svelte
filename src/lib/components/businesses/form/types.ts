// Types for business form components

export interface Phone {
  phone_number: string;
  status: string;
}

export interface Address {
  street_address: string;
  secondary_street_address: string;
  city: string;
  state_id: string;
  zip_code: string; // This is stored as zip_code_id in the database
  status: string;
}

export interface SocialMedia {
  social_media_account: string;
  service_type: string;
  status: string;
}

export interface Employee {
  id?: string;
  contact_id: string;
  contact_name: string;
  status: string;
  role?: string;
  isNew?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface StateOption {
  id: string;
  name: string;
  abbreviation: string;
}

export interface ContactOption {
  id: string;
  name: string;
}

export interface FormData {
  business_name: string;
  status: string;
  phones: Phone[];
  addresses: Address[];
  socialMedia: SocialMedia[];
}

export interface BusinessFormErrors {
  [key: string]: string;
}
