export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  genderId?: string;
  raceId?: string;
  pronouns?: string;
  vanid?: string;
  status: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  emails?: ContactEmail[];
  phoneNumbers?: ContactPhoneNumber[];
  addresses?: ContactAddress[];
  socialMediaAccounts?: ContactSocialMedia[];
  tags?: ContactTag[];
}

export interface ContactEmail {
  id: string;
  contactId: string;
  email: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  updatedById?: string;
}

export interface ContactPhoneNumber {
  id: string;
  contactId: string;
  phoneNumber: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  updatedById?: string;
}

export interface ContactAddress {
  id: string;
  contactId: string;
  streetAddress: string;
  secondaryStreetAddress?: string;
  city: string;
  stateId?: string;
  zipCodeId?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  updatedById?: string;
}

export interface ContactSocialMedia {
  id: string;
  contactId: string;
  serviceType: string;
  socialMediaAccount: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  updatedById?: string;
}

export interface ContactTag {
  id: string;
  contactId: string;
  workspaceId: string;
  tag: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Gender {
  id: string;
  gender: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Race {
  id: string;
  race: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface State {
  id: string;
  name: string;
  abbreviation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZipCode {
  id: string;
  name: string;
  stateId?: string;
  countyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactView {
  id: string;
  viewName: string;
  workspaceId: string;
  firstName: boolean;
  lastName: boolean;
  middleName: boolean;
  gender: boolean;
  race: boolean;
  pronouns: boolean;
  vanid: boolean;
  emails: boolean;
  phoneNumbers: boolean;
  addresses: boolean;
  socialMediaAccounts: boolean;
  filters: any[];
  sorting: any[];
  createdAt: string;
  updatedAt: string;
  createdById: string;
}
