import { pgTable, pgEnum, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define custom enum types
export const businessEmployeeStatusEnum = pgEnum('business_employee_status', ['active', 'inactive', 'fired', 'suspended']);
export const businessStatusEnum = pgEnum('business_status', ['active', 'inactive', 'closed']);
export const contactAddressStatusEnum = pgEnum('contact_address_status', ['active', 'inactive', 'moved', 'wrong address']);
export const contactEmailStatusEnum = pgEnum('contact_email_status', ['active', 'inactive', 'bounced', 'unsubscribed']);
export const contactPhoneStatusEnum = pgEnum('contact_phone_status', ['active', 'inactive', 'wrong number', 'disconnected']);
export const contactStatusEnum = pgEnum('contact_status', ['active', 'inactive', 'deceased', 'moved']);
export const donationStatusEnum = pgEnum('donation_status', ['promise', 'donated', 'processing', 'cleared']);
export const socialMediaServiceEnum = pgEnum('social_media_service', ['facebook', 'twitter', 'bluesky', 'tiktok', 'instagram', 'threads', 'youtube']);
export const socialMediaStatusEnum = pgEnum('social_media_status', ['active', 'inactive', 'blocked', 'deleted']);
export const workspaceRoleEnum = pgEnum('workspace_role', ['Super Admin', 'Admin', 'Basic User', 'Volunteer']);
export const inviteStatusEnum = pgEnum('invite_status', ['Pending', 'Accepted', 'Declined', 'Expired']);
export const interactionTypeEnum = pgEnum('interaction_type', ['note', 'call', 'email', 'in_person']);
export const interactionStatusEnum = pgEnum('interaction_status', ['active', 'archived', 'deleted']);

// Users Table - For Hono Auth
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  avatar: text('avatar'),  // Added column to store avatar image path or data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true).notNull(),
  role: text('role').default('user').notNull(),
  isGlobalSuperAdmin: boolean('is_global_super_admin').default(false).notNull()
});

// Main Tables from Supabase Schema
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logo: text('logo'),
  hasEngage: boolean('has_engage').default(true).notNull(),
  hasHelpdesk: boolean('has_helpdesk').default(false).notNull(),
  hasPathway: boolean('has_pathway').default(false).notNull(),
  hasPulse: boolean('has_pulse').default(false).notNull(),
  hasCompass: boolean('has_compass').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id)
});

export const userWorkspaces = pgTable('user_workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  role: workspaceRoleEnum('role').default('Basic User'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const genders = pgTable('genders', {
  id: uuid('id').primaryKey().defaultRandom(),
  gender: text('gender').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const races = pgTable('races', {
  id: uuid('id').primaryKey().defaultRandom(),
  race: text('race').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'),
  genderId: uuid('gender_id').references(() => genders.id),
  raceId: uuid('race_id').references(() => races.id),
  pronouns: text('pronouns'),
  vanid: text('vanid'),
  status: contactStatusEnum('status').default('active'),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id),
  updatedById: uuid('updated_by').references(() => users.id)
});

export const contactEmails = pgTable('contact_emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id),
  email: text('email').notNull(),
  status: contactEmailStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id),
  updatedById: uuid('updated_by').references(() => users.id)
});

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

export const states = pgTable('states', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  abbreviation: text('abbreviation').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const counties = pgTable('counties', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  stateId: uuid('state_id').references(() => states.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const zipCodes = pgTable('zip_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  stateId: uuid('state_id').references(() => states.id),
  countyId: uuid('county_id').references(() => counties.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const contactAddresses = pgTable('contact_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id),
  streetAddress: text('street_address').notNull(),
  secondaryStreetAddress: text('secondary_street_address'),
  city: text('city').notNull(),
  stateId: uuid('state_id').references(() => states.id),
  zipCodeId: uuid('zip_code_id').references(() => zipCodes.id),
  status: contactAddressStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id),
  updatedById: uuid('updated_by').references(() => users.id)
});

export const contactSocialMediaAccounts = pgTable('contact_social_media_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id),
  serviceType: socialMediaServiceEnum('service_type').notNull(),
  socialMediaAccount: text('social_media_account').notNull(),
  status: socialMediaStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id),
  updatedById: uuid('updated_by').references(() => users.id)
});

export const contactTags = pgTable('contact_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const contactViews = pgTable('contact_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewName: text('view_name').notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  firstName: boolean('first_name'),
  lastName: boolean('last_name'),
  middleName: boolean('middle_name'),
  gender: boolean('gender'),
  race: boolean('race'),
  pronouns: boolean('pronouns'),
  vanid: boolean('vanid'),
  emails: boolean('emails'),
  phoneNumbers: boolean('phone_numbers'),
  addresses: boolean('addresses'),
  socialMediaAccounts: boolean('social_media_accounts'),
  filters: jsonb('filters'),
  sorting: jsonb('sorting'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id)
});

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessName: text('business_name').notNull(),
  status: businessStatusEnum('status').default('active'),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const businessAddresses = pgTable('business_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id),
  streetAddress: text('street_address').notNull(),
  secondaryStreetAddress: text('secondary_street_address'),
  city: text('city').notNull(),
  stateId: uuid('state_id').references(() => states.id),
  zipCodeId: uuid('zip_code_id').references(() => zipCodes.id),
  status: contactAddressStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const businessPhoneNumbers = pgTable('business_phone_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id),
  phoneNumber: text('phone_number').notNull(),
  status: contactPhoneStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const businessSocialMediaAccounts = pgTable('business_social_media_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id),
  serviceType: socialMediaServiceEnum('service_type').notNull(),
  socialMediaAccount: text('social_media_account').notNull(),
  status: socialMediaStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const businessEmployees = pgTable('business_employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  status: businessEmployeeStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const businessTags = pgTable('business_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const businessViews = pgTable('business_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewName: text('view_name').notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  businessName: boolean('business_name'),
  addresses: boolean('addresses'),
  phoneNumbers: boolean('phone_numbers'),
  socialMediaAccounts: boolean('social_media_accounts'),
  employees: boolean('employees'),
  filters: jsonb('filters'),
  sorting: jsonb('sorting'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

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

export const donationTags = pgTable('donation_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  donationId: uuid('donation_id').references(() => donations.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const donationViews = pgTable('donation_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewName: text('view_name').notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  amount: boolean('amount').default(true),
  status: boolean('status').default(true),
  paymentType: boolean('payment_type').default(true),
  notes: boolean('notes').default(false),
  filters: jsonb('filters'),
  sorting: jsonb('sorting'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id)
});

export const workspaceSubscriptions = pgTable('workspace_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  billingCycleStart: timestamp('billing_cycle_start').notNull(),
  billingCycleEnd: timestamp('billing_cycle_end').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const workspacePayments = pgTable('workspace_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  stripePaymentId: text('stripe_payment_id').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// User Invites table for workspace invitations
export const userInvites = pgTable('user_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  role: workspaceRoleEnum('role').default('Basic User'),
  status: inviteStatusEnum('status').default('Pending'),
  invitedById: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  acceptedAt: timestamp('accepted_at'),
  token: text('token').notNull().unique(),
  isSuperAdmin: boolean('is_super_admin').default(false).notNull()
});

// Audit logs for Super Admin actions
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// Interaction streams for contacts and businesses
export const interactionStreams = pgTable('interaction_streams', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  businessId: uuid('business_id').references(() => businesses.id),
  interactionType: interactionTypeEnum('interaction_type').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  interactionDate: timestamp('interaction_date').defaultNow().notNull(),
  status: interactionStatusEnum('status').default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdById: uuid('created_by').references(() => users.id),
  updatedById: uuid('updated_by').references(() => users.id)
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  userWorkspaces: many(userWorkspaces),
  createdWorkspaces: many(workspaces, { relationName: 'userCreatedWorkspaces' }),
  createdContacts: many(contacts, { relationName: 'userCreatedContacts' }),
  updatedContacts: many(contacts, { relationName: 'userUpdatedContacts' }),
  createdContactEmails: many(contactEmails, { relationName: 'userCreatedContactEmails' }),
  updatedContactEmails: many(contactEmails, { relationName: 'userUpdatedContactEmails' }),
  createdContactPhoneNumbers: many(contactPhoneNumbers, { relationName: 'userCreatedContactPhoneNumbers' }),
  updatedContactPhoneNumbers: many(contactPhoneNumbers, { relationName: 'userUpdatedContactPhoneNumbers' }),
  createdContactAddresses: many(contactAddresses, { relationName: 'userCreatedContactAddresses' }),
  updatedContactAddresses: many(contactAddresses, { relationName: 'userUpdatedContactAddresses' }),
  createdContactSocialMediaAccounts: many(contactSocialMediaAccounts, { relationName: 'userCreatedContactSocialMediaAccounts' }),
  updatedContactSocialMediaAccounts: many(contactSocialMediaAccounts, { relationName: 'userUpdatedContactSocialMediaAccounts' }),
  createdContactViews: many(contactViews, { relationName: 'userCreatedContactViews' }),
  createdDonationViews: many(donationViews, { relationName: 'userCreatedDonationViews' }),
  sentInvites: many(userInvites, { relationName: 'userSentInvites' }),
  createdInteractionStreams: many(interactionStreams, { relationName: 'userCreatedInteractionStreams' }),
  updatedInteractionStreams: many(interactionStreams, { relationName: 'userUpdatedInteractionStreams' })
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [workspaces.createdById],
    references: [users.id],
    relationName: 'userCreatedWorkspaces'
  }),
  userWorkspaces: many(userWorkspaces),
  contacts: many(contacts),
  contactTags: many(contactTags),
  contactViews: many(contactViews),
  businesses: many(businesses),
  businessViews: many(businessViews),
  donationViews: many(donationViews),
  subscriptions: many(workspaceSubscriptions),
  payments: many(workspacePayments),
  userInvites: many(userInvites),
  interactionStreams: many(interactionStreams)
}));

export const userWorkspacesRelations = relations(userWorkspaces, ({ one }) => ({
  user: one(users, {
    fields: [userWorkspaces.userId],
    references: [users.id]
  }),
  workspace: one(workspaces, {
    fields: [userWorkspaces.workspaceId],
    references: [workspaces.id]
  })
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [contacts.workspaceId],
    references: [workspaces.id]
  }),
  gender: one(genders, {
    fields: [contacts.genderId],
    references: [genders.id]
  }),
  race: one(races, {
    fields: [contacts.raceId],
    references: [races.id]
  }),
  createdBy: one(users, {
    fields: [contacts.createdById],
    references: [users.id],
    relationName: 'userCreatedContacts'
  }),
  updatedBy: one(users, {
    fields: [contacts.updatedById],
    references: [users.id],
    relationName: 'userUpdatedContacts'
  }),
  emails: many(contactEmails),
  phoneNumbers: many(contactPhoneNumbers),
  addresses: many(contactAddresses),
  socialMediaAccounts: many(contactSocialMediaAccounts),
  tags: many(contactTags),
  businessEmployments: many(businessEmployees),
  interactionStreams: many(interactionStreams)
}));

// Add the remaining relation definitions for all tables
export const businessesRelations = relations(businesses, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [businesses.workspaceId],
    references: [workspaces.id]
  }),
  addresses: many(businessAddresses),
  phoneNumbers: many(businessPhoneNumbers),
  socialMediaAccounts: many(businessSocialMediaAccounts),
  employees: many(businessEmployees),
  tags: many(businessTags),
  donations: many(donations),
  interactionStreams: many(interactionStreams)
}));

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

// Donation Views Relations
export const donationViewsRelations = relations(donationViews, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [donationViews.workspaceId],
    references: [workspaces.id]
  }),
  createdBy: one(users, {
    fields: [donationViews.createdById],
    references: [users.id],
    relationName: 'userCreatedDonationViews'
  })
}));

// User Invites Relations
export const userInvitesRelations = relations(userInvites, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [userInvites.workspaceId],
    references: [workspaces.id]
  }),
  invitedBy: one(users, {
    fields: [userInvites.invitedById],
    references: [users.id],
    relationName: 'userSentInvites'
  })
}));

// Interaction Streams Relations
export const interactionStreamsRelations = relations(interactionStreams, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [interactionStreams.workspaceId],
    references: [workspaces.id]
  }),
  contact: one(contacts, {
    fields: [interactionStreams.contactId],
    references: [contacts.id]
  }),
  business: one(businesses, {
    fields: [interactionStreams.businessId],
    references: [businesses.id]
  }),
  createdBy: one(users, {
    fields: [interactionStreams.createdById],
    references: [users.id],
    relationName: 'userCreatedInteractionStreams'
  }),
  updatedBy: one(users, {
    fields: [interactionStreams.updatedById],
    references: [users.id],
    relationName: 'userUpdatedInteractionStreams'
  })
}));
