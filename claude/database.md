# Civics Lab Database Structure

This document provides a comprehensive overview of the database structure for the Civics Lab application. The database is organized into tables that manage contacts, businesses, locations, and related information within a multi-tenant workspace model.

## Table of Contents

1. [Primary Entities](#primary-entities)
2. [Contact-Related Tables](#contact-related-tables)
3. [Business-Related Tables](#business-related-tables)
4. [Location-Related Tables](#location-related-tables)
5. [View Tables](#view-tables)
6. [Workspace & User Tables](#workspace--user-tables)
7. [Payment & Subscription Tables](#payment--subscription-tables)
8. [Enums](#enums)
9. [Database Views](#database-views)
10. [Database Functions](#database-functions)
11. [Security Model](#security-model)

## Primary Entities

### Contacts

The `contacts` table stores information about individuals within the system.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| first_name | text | First name (required) |
| middle_name | text | Middle name (optional) |
| last_name | text | Last name (required) |
| gender_id | uuid | Foreign key to genders table |
| race_id | uuid | Foreign key to races table |
| pronouns | text | Person's pronouns |
| vanid | text | VAN ID for voter activation network |
| status | enum | Current status (active, inactive, deceased, moved) |
| workspace_id | uuid | Foreign key to workspaces table |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |
| created_by | uuid | Creator's ID |
| updated_by | uuid | Updater's ID |

### Businesses

The `businesses` table stores information about organizations within the system.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| business_name | text | Name of the business (required) |
| status | enum | Current status (active, inactive, closed) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## Contact-Related Tables

### Contact Addresses

The `contact_addresses` table stores addresses for contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| contact_id | uuid | Foreign key to contacts table |
| street_address | text | Street address (required) |
| secondary_street_address | text | Additional address info |
| city | text | City name (required) |
| state_id | uuid | Foreign key to states table |
| zip_code_id | uuid | Foreign key to zip_codes table |
| status | enum | Address status (active, inactive, moved, wrong address) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |
| created_by | uuid | Creator's ID |
| updated_by | uuid | Updater's ID |

### Contact Emails

The `contact_emails` table stores email addresses for contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| contact_id | uuid | Foreign key to contacts table |
| email | text | Email address (required) |
| status | enum | Email status (active, inactive, bounced, unsubscribed) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |
| created_by | uuid | Creator's ID |
| updated_by | uuid | Updater's ID |

### Contact Phone Numbers

The `contact_phone_numbers` table stores phone numbers for contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| contact_id | uuid | Foreign key to contacts table |
| phone_number | text | Phone number (required) |
| status | enum | Phone status (active, inactive, wrong number, disconnected) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |
| created_by | uuid | Creator's ID |
| updated_by | uuid | Updater's ID |

### Contact Social Media Accounts

The `contact_social_media_accounts` table stores social media accounts for contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| contact_id | uuid | Foreign key to contacts table |
| service_type | enum | Social media platform type |
| social_media_account | text | Account identifier (required) |
| status | enum | Account status (active, inactive, blocked, deleted) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |
| created_by | uuid | Creator's ID |
| updated_by | uuid | Updater's ID |

### Contact Tags

The `contact_tags` table associates tags with contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| contact_id | uuid | Foreign key to contacts table |
| tag | text | Tag name (required) |
| workspace_id | uuid | Foreign key to workspaces table |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## Business-Related Tables

### Business Addresses

The `business_addresses` table stores addresses for businesses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| business_id | uuid | Foreign key to businesses table |
| street_address | text | Street address (required) |
| secondary_street_address | text | Additional address info |
| city | text | City name (required) |
| state_id | uuid | Foreign key to states table |
| zip_code_id | uuid | Foreign key to zip_codes table |
| status | enum | Address status (active, inactive, moved, wrong address) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Business Phone Numbers

The `business_phone_numbers` table stores phone numbers for businesses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| business_id | uuid | Foreign key to businesses table |
| phone_number | text | Phone number (required) |
| status | enum | Phone status (active, inactive, wrong number, disconnected) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Business Social Media Accounts

The `business_social_media_accounts` table stores social media accounts for businesses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| business_id | uuid | Foreign key to businesses table |
| service_type | enum | Social media platform type |
| social_media_account | text | Account identifier (required) |
| status | enum | Account status (active, inactive, blocked, deleted) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Business Employees

The `business_employees` table associates contacts as employees of businesses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| business_id | uuid | Foreign key to businesses table |
| contact_id | uuid | Foreign key to contacts table |
| status | enum | Employee status (active, inactive, fired, suspended) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Business Tags

The `business_tags` table associates tags with businesses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| business_id | uuid | Foreign key to businesses table |
| tag | text | Tag name (required) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## Location-Related Tables

### States

The `states` table stores state/province information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| name | text | State name (required) |
| abbreviation | text | State abbreviation (required) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Counties

The `counties` table stores county information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| name | text | County name (required) |
| state_id | uuid | Foreign key to states table |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Zip Codes

The `zip_codes` table stores postal code information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| name | text | Zip code (required) |
| state_id | uuid | Foreign key to states table |
| county_id | uuid | Foreign key to counties table |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## View Tables

### Contact Views

The `contact_views` table stores custom views for contacts within a workspace.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| view_name | text | Name of the view (required) |
| workspace_id | uuid | Foreign key to workspaces table |
| first_name | boolean | Whether to show first name |
| middle_name | boolean | Whether to show middle name |
| last_name | boolean | Whether to show last name |
| gender | boolean | Whether to show gender |
| race | boolean | Whether to show race |
| pronouns | boolean | Whether to show pronouns |
| vanid | boolean | Whether to show VAN ID |
| emails | boolean | Whether to show emails |
| phone_numbers | boolean | Whether to show phone numbers |
| addresses | boolean | Whether to show addresses |
| social_media_accounts | boolean | Whether to show social media |
| filters | jsonb | Filter criteria |
| sorting | jsonb | Sort criteria |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |
| created_by | uuid | Creator's ID |

### Business Views

The `business_views` table stores custom views for businesses within a workspace.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| view_name | text | Name of the view (required) |
| workspace_id | uuid | Foreign key to workspaces table |
| business_name | boolean | Whether to show business name |
| addresses | boolean | Whether to show addresses |
| phone_numbers | boolean | Whether to show phone numbers |
| social_media_accounts | boolean | Whether to show social media |
| employees | boolean | Whether to show employees |
| filters | jsonb | Filter criteria |
| sorting | jsonb | Sort criteria |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## Workspace & User Tables

### Workspaces

The `workspaces` table stores workspace information for multi-tenancy.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| name | text | Workspace name (required) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |
| created_by | uuid | Creator's ID |

### User Workspaces

The `user_workspaces` table associates users with workspaces and their roles.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| user_id | uuid | User ID (required) |
| workspace_id | uuid | Foreign key to workspaces table |
| role | enum | User role in the workspace |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## Payment & Subscription Tables

### Workspace Subscriptions

The `workspace_subscriptions` table tracks subscription information for workspaces.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| workspace_id | uuid | Foreign key to workspaces table |
| stripe_subscription_id | text | Stripe subscription ID (required) |
| plan | text | Subscription plan (required) |
| status | text | Subscription status (required) |
| billing_cycle_start | timestamp with time zone | Start date of billing cycle (required) |
| billing_cycle_end | timestamp with time zone | End date of billing cycle (required) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Workspace Payments

The `workspace_payments` table tracks payment information for workspaces.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| workspace_id | uuid | Foreign key to workspaces table |
| stripe_payment_id | text | Stripe payment ID (required) |
| amount | numeric | Payment amount (required) |
| currency | text | Payment currency (required) |
| payment_date | timestamp with time zone | Date of payment (required) |
| status | text | Payment status (required) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Donations

The `donations` table tracks donations from contacts or businesses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| contact_id | uuid | Foreign key to contacts table |
| business_id | uuid | Foreign key to businesses table |
| amount | numeric | Donation amount (required) |
| status | enum | Donation status (promise, donated, processing, cleared) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## Additional Reference Tables

### Genders

The `genders` table stores gender options for contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| gender | text | Gender name (required) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

### Races

The `races` table stores race/ethnicity options for contacts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, auto-generated |
| race | text | Race name (required) |
| created_at | timestamp with time zone | Creation timestamp |
| updated_at | timestamp with time zone | Last update timestamp |

## Enums

The database uses several enumerated types to ensure data consistency:

| Enum Name | Options |
|-----------|---------|
| business_employee_status | active, inactive, fired, suspended |
| business_status | active, inactive, closed |
| contact_address_status | active, inactive, moved, wrong address |
| contact_email_status | active, inactive, bounced, unsubscribed |
| contact_phone_status | active, inactive, wrong number, disconnected |
| contact_status | active, inactive, deceased, moved |
| donation_status | promise, donated, processing, cleared |
| social_media_service | facebook, twitter, bluesky, tiktok, instagram, threads, youtube |
| social_media_status | active, inactive, blocked, deleted |
| workspace_role | Super Admin, Admin, Basic User, Volunteer |

## Database Views

The database includes several predefined views for common queries:

### active_contacts

A view that filters contacts with active status, includes joined gender and race information.

```sql
SELECT c.id,
    c.first_name,
    c.middle_name,
    c.last_name,
    c.race_id,
    c.gender_id,
    c.pronouns,
    c.vanid,
    c.status,
    c.created_at,
    c.updated_at,
    r.race AS race_name,
    g.gender AS gender_name
   FROM ((contacts c
     LEFT JOIN races r ON ((c.race_id = r.id))
     LEFT JOIN genders g ON ((c.gender_id = g.id))
  WHERE (c.status = 'active'::contact_status)
```

### active_businesses

A view that filters businesses with active status.

```sql
SELECT businesses.id,
    businesses.business_name,
    businesses.status,
    businesses.created_at,
    businesses.updated_at
   FROM businesses
  WHERE (businesses.status = 'active'::business_status)
```

### contact_full_addresses

A view that joins contact addresses with state, county, and zip code information for complete address details.

```sql
SELECT ca.id,
    ca.contact_id,
    ca.street_address,
    ca.secondary_street_address,
    ca.city,
    ca.state_id,
    ca.zip_code_id,
    ca.status,
    ca.created_at,
    ca.updated_at,
    c.first_name,
    c.last_name,
    s.name AS state_name,
    s.abbreviation AS state_abbreviation,
    z.name AS zip_code,
    co.name AS county_name
   FROM contact_addresses ca
     JOIN contacts c ON ca.contact_id = c.id
     JOIN states s ON ca.state_id = s.id
     JOIN zip_codes z ON ca.zip_code_id = z.id
     JOIN counties co ON z.county_id = co.id
  WHERE ca.status = 'active'::contact_address_status
```

### business_full_addresses

A view that joins business addresses with state, county, and zip code information for complete address details.

```sql
SELECT ba.id,
    ba.business_id,
    ba.street_address,
    ba.secondary_street_address,
    ba.city,
    ba.state_id,
    ba.zip_code_id,
    ba.status,
    ba.created_at,
    ba.updated_at,
    b.business_name,
    s.name AS state_name,
    s.abbreviation AS state_abbreviation,
    z.name AS zip_code,
    co.name AS county_name
   FROM business_addresses ba
     JOIN businesses b ON ba.business_id = b.id
     JOIN states s ON ba.state_id = s.id
     JOIN zip_codes z ON ba.zip_code_id = z.id
     JOIN counties co ON z.county_id = co.id
  WHERE ba.status = 'active'::contact_address_status
```

## Database Functions

The database includes several functions for common operations:

| Function Name | Description | Return Type |
|---------------|-------------|------------|
| add_contact_tags | Adds tags to contacts | void |
| get_contact_details | Retrieves comprehensive details for a specific contact including related data | record |
| get_business_details | Retrieves comprehensive details for a specific business including related data | record |
| get_contacts_by_workspace | Retrieves all contacts within a workspace | contacts[] |
| get_contact_emails_by_workspace | Retrieves all contact emails within a workspace | record[] |
| get_contact_phones_by_workspace | Retrieves all contact phones within a workspace | record[] |
| get_views_by_workspace | Retrieves custom views within a workspace | contact_views[] |
| handle_workspace_subscription_status | Trigger function for subscription status changes | trigger |
| update_updated_at_column | Trigger function to update the updated_at timestamp | trigger |

## Security Model

The database implements comprehensive Row Level Security (RLS) with the following key features:

### Workspace Isolation

Contacts, views, and related data are isolated by workspace. Users can only access data from workspaces they are members of.

Example policy for contacts:
```sql
CREATE POLICY "Users can view contacts in their workspaces" 
ON contacts
FOR SELECT
USING (
  workspace_id IN (
    SELECT id FROM workspaces WHERE created_by = auth.uid()
    UNION 
    SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
  )
);
```

### Role-Based Permissions

The application uses four roles with different permission levels:

1. **Super Admin** - Full access to workspace, can delete workspaces
2. **Admin** - Can manage users and most data within a workspace
3. **Basic User** - Can create and update most records, limited management rights
4. **Volunteer** - Most restricted access for temporary or limited users

Example policy for workspace management:
```sql
CREATE POLICY "Users can update workspaces they manage" 
ON workspaces
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_workspaces
    WHERE workspace_id = id 
    AND user_id = auth.uid()
    AND role IN ('Super Admin', 'Admin')
  )
);
```

### Active Subscription Enforcement

Some policies check workspace subscription status to control access:

```sql
CREATE POLICY "Users can access data from their workspaces" 
ON contacts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_workspaces uw
    WHERE uw.user_id = auth.uid()
    AND uw.workspace_id IN (
      SELECT workspace_id FROM workspace_subscriptions
      WHERE status = 'active'
    )
  )
);
```

### Automated Timestamps and Audit Trail

The database uses triggers to automatically update timestamps and track who created or modified records:

```sql
CREATE TRIGGER update_timestamp
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

This comprehensive security model ensures data is properly isolated between tenants (workspaces) while enforcing appropriate access controls based on user roles and subscription status.

## Relationships and Foreign Keys

The database is designed with numerous relationships to maintain data integrity:

1. Contacts can have multiple:
   - Addresses
   - Email addresses
   - Phone numbers
   - Social media accounts
   - Tags

2. Businesses can have multiple:
   - Addresses
   - Phone numbers
   - Social media accounts
   - Employees (contacts)
   - Tags

3. Locations have hierarchical relationships:
   - States contain counties
   - Counties contain zip codes
   - Addresses reference states and zip codes

4. Workspaces organize:
   - Contacts
   - Custom views
   - User access and permissions
   - Subscription and payment data

This structure allows for efficient organization and retrieval of civic engagement data while maintaining proper relationships between entities.
