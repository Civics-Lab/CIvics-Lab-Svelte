# Invite System Implementation

This document describes the implementation of the invite system for Civics Lab Svelte application.

## Overview

The invite system allows workspace administrators to invite users to join their workspace. If the invited user already has an account, they are automatically added to the workspace. If they don't have an account yet, an invitation is sent via email (simulated in this implementation) with a link to the signup page.

When a user signs up via an invitation link, they are automatically connected to the workspace with the specified role. The system also checks for any other pending invitations for the same email address and connects the user to those workspaces as well.

## Database Schema

A new `user_invites` table has been added with the following structure:

```sql
CREATE TABLE "user_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "workspace_id" uuid REFERENCES "workspaces"("id"),
  "role" "workspace_role" DEFAULT 'Basic User',
  "status" "invite_status" DEFAULT 'Pending',
  "invited_by" uuid REFERENCES "users"("id"),
  "invited_at" timestamp DEFAULT now(),
  "expires_at" timestamp,
  "accepted_at" timestamp,
  "token" text NOT NULL UNIQUE
);
```

A new enum type `invite_status` has been created with values: `Pending`, `Accepted`, `Declined`, `Expired`.

## Components

### 1. Workspace People Page (`/engage/settings/workspace/people`)

- Displays a list of current workspace members
- Displays a list of pending invitations
- Allows adding new members via email
- Handles existing users and new invitations
- Provides a form to specify the email and role for the new member
- Shows and allows copying invitation links

### 2. Signup Page (`/signup`)

- Modified to accept an invite token as a URL parameter
- When an invite token is present, it fetches the invite details and pre-fills the email
- The email field is read-only when coming from an invitation
- After successful signup, connects the user to the invited workspace

### 3. API Endpoints

#### `/api/auth/signup`

- Modified to accept an invite token
- Processes the invitation during signup
- Creates user-workspace connections for all pending invites

#### `/api/invites`

- GET: Fetches all invites for the current workspace
- POST: Creates a new invite
- DELETE: Cancels an existing invite

#### `/api/invites/[token]`

- GET: Fetches details about a specific invite
- POST: Accepts or declines an invitation

## Files Modified/Created

1. Database Migration:
   - `/drizzle/0004_user_invites_table.sql` - Adds the user_invites table

2. Server Components:
   - `/src/routes/engage/settings/workspace/people/+page.server.ts` - Handles workspace members and invites
   - `/src/routes/signup/+page.server.ts` - Handles invite token in signup

3. Client Components:
   - `/src/routes/engage/settings/workspace/people/+page.svelte` - Updated UI for invites
   - `/src/routes/signup/+page.svelte` - Updated UI for invited users

4. Auth Related:
   - `/src/lib/auth/client.ts` - Updated to handle invite tokens
   - `/src/routes/api/auth/signup/+server.ts` - Updated to accept invite token
   - `/src/routes/api/auth/service.ts` - Updated to process invites during signup

5. API Endpoints:
   - `/src/routes/api/invites/+server.ts` - API for handling invites
   - `/src/routes/api/invites/[token]/+server.ts` - API for specific invite

## How It Works

1. **Inviting a User**:
   - Admin visits the people page and clicks "Add Member"
   - Enters the email and selects a role
   - If the user exists, they're automatically added to the workspace
   - If the user doesn't exist, an invite is created with a unique token
   - The invite link is displayed and can be copied

2. **Accepting an Invite**:
   - User clicks the invite link and is directed to the signup page
   - The email field is pre-filled and locked
   - User completes the signup form
   - Upon signup, user is connected to the workspace
   - User is redirected to the app instead of onboarding

3. **Checking for Other Invites**:
   - During signup, the system checks for any other pending invites for the same email
   - User is connected to all workspaces they've been invited to

## Improvements for Production

In a production environment, the following improvements should be implemented:

1. **Email Integration**:
   - Send actual emails to invited users
   - Include workspace name and inviter information in the email
   - Add reminder emails for pending invites

2. **Enhanced Security**:
   - Add rate limiting for invite creation
   - Add IP tracking for invite acceptance
   - Implement more robust token generation and validation

3. **User Experience**:
   - Add an invite landing page with workspace information
   - Add ability to decline invites
   - Add notifications for accepted/declined invites
