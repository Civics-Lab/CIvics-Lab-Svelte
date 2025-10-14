# User Invite System Implementation with SendGrid

This document outlines the complete reimplementation of the user invite system using SendGrid for email delivery.

## Overview

The invite system has been rebuilt to use SendGrid instead of the previous email service. It supports both workspace invitations and Super Admin invitations with proper email templates and error handling.

## Changes Made

### 1. Email Service (`src/lib/server/email.ts`)
- **Replaced** nodemailer with SendGrid
- **Added** SendGrid API integration using `@sendgrid/mail`
- **Created** professional HTML email templates for invitations
- **Added** separate email template for Super Admin invites
- **Improved** error handling and logging

### 2. Invites Service (`src/lib/server/invites.ts`)
- **Enhanced** invitation creation with better Super Admin support
- **Added** `processPendingInvitations()` function for signup flow
- **Added** `listPendingSuperAdminInvites()` function
- **Updated** email sending to use new SendGrid service
- **Improved** error handling and validation

### 3. API Endpoints

#### Invites API (`src/routes/api/invites/+server.ts`)
- **Updated** to use the new invites service functions
- **Improved** error handling and responses
- **Maintained** existing functionality for workspace invites

#### Super Admin Invites API (`src/routes/api/admin/super-admins/invite/+server.ts`)
- **Created** new endpoint for Super Admin invitations
- **Added** GET endpoint to list pending Super Admin invites
- **Added** POST endpoint to send Super Admin invitations
- **Integrated** with audit logging

### 4. Authentication Service (`src/routes/api/auth/service.ts`)
- **Simplified** signup process to use `processPendingInvitations()`
- **Added** proper Super Admin privilege handling during signup
- **Improved** token generation to include Super Admin status
- **Enhanced** error handling and logging

### 5. Environment Configuration
- **Updated** `.env` file with SendGrid configuration:
  - `SENDGRID_API_KEY`: Your SendGrid API key
  - `EMAIL_FROM`: The sender email address (noreply@civicslab.net)
  - `BASE_URL`: The base URL for invitation links

### 6. Package Dependencies
- **Added** `@sendgrid/mail` to package.json dependencies
- **Removed** dependency on nodemailer (can be removed if not used elsewhere)

## Features

### Workspace Invitations
- Send invitation emails to join specific workspaces
- Professional HTML email templates with workspace branding
- Automatic user addition for existing users
- Invitation token validation and expiration
- Role-based access control

### Super Admin Invitations
- Send special invitation emails for Super Admin privileges
- Distinct email template highlighting administrative privileges
- Global system access without workspace limitations
- Separate API endpoints for management

### Email Templates
- **Workspace Invites**: Blue-themed template with workspace information
- **Super Admin Invites**: Red-themed template emphasizing elevated privileges
- **Responsive Design**: Mobile-friendly email layouts
- **Professional Branding**: Civics Lab branded templates

### Error Handling
- Comprehensive error logging
- Graceful fallback when SendGrid is not configured
- Clear error messages for troubleshooting
- Validation of email addresses and invite tokens

## Usage

### Sending a Workspace Invitation

```javascript
const result = await createInvitation({
  email: 'user@example.com',
  workspaceId: 'workspace-uuid',
  role: 'Basic User',
  invitedById: 'inviter-user-uuid',
  isSuperAdmin: false
});
```

### Sending a Super Admin Invitation

```javascript
const result = await createInvitation({
  email: 'admin@example.com',
  workspaceId: null,
  role: 'Super Admin',
  invitedById: 'current-admin-uuid',
  isSuperAdmin: true
});
```

### API Endpoints

#### Workspace Invites
- `GET /api/invites` - List pending workspace invites
- `POST /api/invites` - Create workspace invitation
- `DELETE /api/invites` - Cancel workspace invitation

#### Super Admin Invites
- `GET /api/admin/super-admins/invite` - List pending Super Admin invites
- `POST /api/admin/super-admins/invite` - Create Super Admin invitation

#### Invite Validation
- `GET /api/invites/[token]` - Get invitation details
- `POST /api/invites/[token]` - Accept/decline invitation

## Database Schema

The system uses the existing `user_invites` table with the following key fields:
- `isSuperAdmin`: Boolean flag for Super Admin invites
- `workspaceId`: Null for Super Admin invites, UUID for workspace invites
- `token`: Unique invitation token
- `status`: Pending/Accepted/Declined/Expired
- `expiresAt`: Invitation expiration timestamp

## Configuration Requirements

### SendGrid Setup
1. Create a SendGrid account
2. Generate an API key with Mail Send permissions
3. Verify your sender domain/email
4. Add the API key to your `.env` file

### Environment Variables
```env
SENDGRID_API_KEY=SG.your-api-key-here
EMAIL_FROM=noreply@yourdomain.com
BASE_URL=https://yourdomain.com
```

## Installation Steps

1. **Install SendGrid package:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Update environment variables** in `.env` file

3. **Run database migrations** (if not already done):
   ```bash
   npm run db:migrate
   ```

4. **Test the email service** by sending a test invitation

## Error Handling

The system includes comprehensive error handling:
- **Invalid API Keys**: Clear error messages when SendGrid is misconfigured
- **Email Validation**: Proper email format validation
- **Token Validation**: Secure invitation token verification
- **Expiration Handling**: Automatic detection of expired invitations
- **Duplicate Prevention**: Checks for existing invitations

## Security Considerations

- **Token Security**: Cryptographically secure invitation tokens
- **Expiration**: 7-day expiration for all invitations
- **Permission Validation**: Strict role-based access control
- **Email Verification**: Invitation emails tied to specific email addresses
- **Audit Logging**: All Super Admin actions are logged

## Future Enhancements

Potential improvements for the invite system:
- **Bulk Invitations**: Support for inviting multiple users at once
- **Custom Email Templates**: Workspace-specific email customization
- **Invitation Analytics**: Track invitation open rates and acceptance
- **Reminder Emails**: Automated follow-up for pending invitations
- **Invitation Limits**: Rate limiting for invitation creation

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check SendGrid API key and sender verification
2. **Invalid sender**: Ensure EMAIL_FROM is verified in SendGrid
3. **Token errors**: Verify BASE_URL is correctly set
4. **Permission denied**: Check user roles and workspace access

### Debug Steps

1. Check server logs for detailed error messages
2. Verify environment variables are properly set
3. Test SendGrid configuration with a simple email
4. Validate database schema includes required columns
5. Check invitation token validity and expiration

## Migration Notes

When migrating from the previous email system:
1. Existing pending invitations will continue to work
2. New invitations will use SendGrid
3. Email templates have been updated with new branding
4. Super Admin invites now have dedicated templates
5. No data loss or user impact expected

This implementation provides a robust, scalable, and professional invitation system using SendGrid's reliable email delivery infrastructure.
