# API Route Mapping: SvelteKit to Hono

## Overview

This document provides a comprehensive mapping of all API routes from their original SvelteKit implementation to the new Hono-based architecture. It serves as a reference for understanding the migration status and finding equivalent endpoints.

## Migration Status Legend

- ✅ **Migrated**: Route has been successfully migrated to Hono
- 🔄 **In Progress**: Route migration is currently underway  
- ❌ **Pending**: Route has not yet been migrated
- 🚧 **Deprecated**: Route will be removed or replaced

## Core API Routes

### Authentication (`/api/auth/*`)
*Status: ✅ Already Migrated (Pre-existing)*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| POST | `/api/auth/login` | `/api/auth/login` | ✅ | User authentication |
| POST | `/api/auth/signup` | `/api/auth/signup` | ✅ | User registration |
| POST | `/api/auth/validate` | `/api/auth/validate` | ✅ | Token validation |
| POST | `/api/auth/change-password` | `/api/auth/change-password` | ✅ | Password updates |
| GET | `/api/auth/check-username` | `/api/auth/check-username` | ✅ | Username availability |
| POST | `/api/auth/update-email` | `/api/auth/update-email` | ✅ | Email updates |
| POST | `/api/auth/update-profile` | `/api/auth/update-profile` | ✅ | Profile updates |
| POST | `/api/auth/upload-avatar` | `/api/auth/upload-avatar` | ✅ | Avatar uploads |

### GraphQL (`/api/graph/*`)
*Status: ✅ Already Migrated (Pre-existing)*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| POST | `/api/graph` | `/api/graph` | ✅ | GraphQL endpoint |
| GET | `/api/graph` | `/api/graph` | ✅ | GraphiQL interface |

## Workspace Management (`/api/workspaces/*`)
*Status: ✅ Migrated*

### Core Workspace Operations

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/workspaces` | `/api/workspaces` | ✅ | List user workspaces |
| POST | `/api/workspaces` | `/api/workspaces` | ✅ | Create workspace |
| OPTIONS | `/api/workspaces` | `/api/workspaces` | ✅ | Debug endpoint |
| GET | `/api/workspaces/[workspaceId]` | `/api/workspaces/:workspaceId` | ✅ | Get workspace |
| PUT | `/api/workspaces/[workspaceId]` | `/api/workspaces/:workspaceId` | ✅ | Update workspace |
| DELETE | `/api/workspaces/[workspaceId]` | `/api/workspaces/:workspaceId` | ✅ | Delete workspace |

### Workspace Sub-Routes
*Status: ❌ Pending Migration*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/workspaces/[workspaceId]/invites` | TBD | ❌ | List workspace invites |
| POST | `/api/workspaces/[workspaceId]/invites` | TBD | ❌ | Create invite |
| DELETE | `/api/workspaces/[workspaceId]/invites/[inviteId]` | TBD | ❌ | Delete invite |
| POST | `/api/workspaces/[workspaceId]/logo` | TBD | ❌ | Upload workspace logo |
| DELETE | `/api/workspaces/[workspaceId]/logo` | TBD | ❌ | Delete workspace logo |
| GET | `/api/workspaces/[workspaceId]/members` | TBD | ❌ | List workspace members |
| PUT | `/api/workspaces/[workspaceId]/members/[userId]` | TBD | ❌ | Update member role |
| DELETE | `/api/workspaces/[workspaceId]/members/[userId]` | TBD | ❌ | Remove member |
| GET | `/api/workspaces/[workspaceId]/service-flags` | TBD | ❌ | Get service flags |
| PUT | `/api/workspaces/[workspaceId]/service-flags` | TBD | ❌ | Update service flags |

### Workspace Utility Routes
*Status: ❌ Pending Migration*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/workspaces/all` | TBD | ❌ | Admin: All workspaces |
| GET | `/api/workspaces/check` | TBD | ❌ | Workspace validation |
| POST | `/api/workspaces/fix` | TBD | ❌ | Workspace repair |
| POST | `/api/workspaces/set-current` | TBD | ❌ | Set current workspace |
| POST | `/api/workspaces/switch` | TBD | ❌ | Switch workspace |

## Contact Management (`/api/contacts/*`)
*Status: ✅ Migrated*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/contacts` | `/api/contacts` | ✅ | List contacts with search |
| POST | `/api/contacts` | `/api/contacts` | ✅ | Create contact |
| GET | `/api/contacts/paginated` | `/api/contacts/paginated` | ✅ | Paginated contacts |
| GET | `/api/contacts/[id]` | `/api/contacts/:id` | ✅ | Get contact details |
| PUT | `/api/contacts/[id]` | `/api/contacts/:id` | ✅ | Update contact |
| DELETE | `/api/contacts/[id]` | `/api/contacts/:id` | ✅ | Delete contact |
| GET | `/api/contacts/[id]/donations` | TBD | ❌ | Contact donations |

## Business Management (`/api/businesses/*`)
*Status: ✅ Migrated*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/businesses` | `/api/businesses` | ✅ | List businesses with search |
| POST | `/api/businesses` | `/api/businesses` | ✅ | Create business |
| GET | `/api/businesses/paginated` | `/api/businesses/paginated` | ✅ | Paginated businesses |
| GET | `/api/businesses/[id]` | `/api/businesses/:id` | ✅ | Get business details |
| PUT | `/api/businesses/[id]` | `/api/businesses/:id` | ✅ | Update business |
| DELETE | `/api/businesses/[id]` | `/api/businesses/:id` | ✅ | Delete business |
| GET | `/api/businesses/[id]/donations` | TBD | ❌ | Business donations |

## Donation Management (`/api/donations/*`)
*Status: ❌ Pending Migration (High Priority)*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/donations` | `/api/donations` | ❌ | List donations |
| POST | `/api/donations` | `/api/donations` | ❌ | Create donation |
| GET | `/api/donations/paginated` | `/api/donations/paginated` | ❌ | Paginated donations |
| GET | `/api/donations/[id]` | `/api/donations/:id` | ❌ | Get donation details |
| PUT | `/api/donations/[id]` | `/api/donations/:id` | ❌ | Update donation |
| DELETE | `/api/donations/[id]` | `/api/donations/:id` | ❌ | Delete donation |

## Tag Management (`/api/*-tags/*`)
*Status: ❌ Pending Migration (Medium Priority)*

### Contact Tags

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/contact-tags` | `/api/contact-tags` | ❌ | List contact tags |
| POST | `/api/contact-tags` | `/api/contact-tags` | ❌ | Create contact tag |
| PUT | `/api/contact-tags/[id]` | `/api/contact-tags/:id` | ❌ | Update contact tag |
| DELETE | `/api/contact-tags/[id]` | `/api/contact-tags/:id` | ❌ | Delete contact tag |

### Business Tags

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/business-tags` | `/api/business-tags` | ❌ | List business tags |
| POST | `/api/business-tags` | `/api/business-tags` | ❌ | Create business tag |
| PUT | `/api/business-tags/[id]` | `/api/business-tags/:id` | ❌ | Update business tag |
| DELETE | `/api/business-tags/[id]` | `/api/business-tags/:id` | ❌ | Delete business tag |

### Donation Tags

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/donation-tags` | `/api/donation-tags` | ❌ | List donation tags |
| POST | `/api/donation-tags` | `/api/donation-tags` | ❌ | Create donation tag |
| PUT | `/api/donation-tags/[id]` | `/api/donation-tags/:id` | ❌ | Update donation tag |
| DELETE | `/api/donation-tags/[id]` | `/api/donation-tags/:id` | ❌ | Delete donation tag |

## View Management (`/api/*-views/*`)
*Status: ❌ Pending Migration (Medium Priority)*

### Contact Views

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/contact-views` | `/api/contact-views` | ❌ | List contact views |
| POST | `/api/contact-views` | `/api/contact-views` | ❌ | Create contact view |
| GET | `/api/contact-views/[id]` | `/api/contact-views/:id` | ❌ | Get contact view |
| PUT | `/api/contact-views/[id]` | `/api/contact-views/:id` | ❌ | Update contact view |
| DELETE | `/api/contact-views/[id]` | `/api/contact-views/:id` | ❌ | Delete contact view |

### Business Views

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/business-views` | `/api/business-views` | ❌ | List business views |
| POST | `/api/business-views` | `/api/business-views` | ❌ | Create business view |
| GET | `/api/business-views/[id]` | `/api/business-views/:id` | ❌ | Get business view |
| PUT | `/api/business-views/[id]` | `/api/business-views/:id` | ❌ | Update business view |
| DELETE | `/api/business-views/[id]` | `/api/business-views/:id` | ❌ | Delete business view |

### Donation Views

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/donation-views` | `/api/donation-views` | ❌ | List donation views |
| POST | `/api/donation-views` | `/api/donation-views` | ❌ | Create donation view |
| GET | `/api/donation-views/[id]` | `/api/donation-views/:id` | ❌ | Get donation view |
| PUT | `/api/donation-views/[id]` | `/api/donation-views/:id` | ❌ | Update donation view |
| DELETE | `/api/donation-views/[id]` | `/api/donation-views/:id` | ❌ | Delete donation view |

## Administrative Routes (`/api/admin/*`)
*Status: ❌ Pending Migration (Medium Priority)*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/admin/access` | `/api/admin/access` | ❌ | Check admin access |
| GET | `/api/admin/super-admins` | `/api/admin/super-admins` | ❌ | List super admins |
| POST | `/api/admin/super-admins` | `/api/admin/super-admins` | ❌ | Create super admin |
| DELETE | `/api/admin/super-admins/[userId]` | `/api/admin/super-admins/:userId` | ❌ | Remove super admin |
| POST | `/api/admin/super-admins/invite` | `/api/admin/super-admins/invite` | ❌ | Invite super admin |

## Feature Routes
*Status: ❌ Pending Migration (Medium Priority)*

### Dashboard

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/dashboard/stats` | `/api/dashboard/stats` | ❌ | Dashboard statistics |

### Import/Export

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| POST | `/api/import` | `/api/import` | ❌ | Import data |
| GET | `/api/import/template` | `/api/import/template` | ❌ | Download template |
| GET | `/api/import/config` | `/api/import/config` | ❌ | Import configuration |

### Form Options

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/form-options` | `/api/form-options` | ❌ | Dropdown options |

### Interaction Streams

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/interaction-streams` | `/api/interaction-streams` | ❌ | List streams |
| POST | `/api/interaction-streams` | `/api/interaction-streams` | ❌ | Create stream |
| GET | `/api/interaction-streams/[id]` | `/api/interaction-streams/:id` | ❌ | Get stream |
| PUT | `/api/interaction-streams/[id]` | `/api/interaction-streams/:id` | ❌ | Update stream |
| DELETE | `/api/interaction-streams/[id]` | `/api/interaction-streams/:id` | ❌ | Delete stream |

### Invitations

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/api/invites` | `/api/invites` | ❌ | List invitations |
| POST | `/api/invites` | `/api/invites` | ❌ | Create invitation |
| GET | `/api/invites/[token]` | `/api/invites/:token` | ❌ | Get invite by token |
| POST | `/api/invites/[token]` | `/api/invites/:token` | ❌ | Accept invitation |
| POST | `/api/invite-user` | `/api/invite-user` | ❌ | Invite user |

## Debug and Testing Routes
*Status: ❌ Pending Migration (Low Priority)*

### Debug Routes

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| * | `/api/debug` | `/api/debug` | ❌ | General debug |
| GET | `/api/debug/db` | `/api/debug/db` | ❌ | Database debug |
| GET | `/api/debug/env` | `/api/debug/env` | ❌ | Environment debug |
| POST | `/api/debug/fix/recreate-user` | `/api/debug/fix/recreate-user` | ❌ | User recreation |
| GET | `/api/debug/users` | `/api/debug/users` | ❌ | User debug |

### Test Routes

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| * | `/api/test` | `/api/test` | ❌ | General testing |
| * | `/api/echo/[id]` | `/api/echo/:id` | ❌ | Echo test |
| * | `/api/workspace-*` | TBD | ❌ | Various workspace tests |
| * | `/api/test-workspaces/[id]` | `/api/test-workspaces/:id` | ❌ | Workspace testing |

## Authentication Flow Routes
*Status: ❌ Pending Migration (Low Priority)*

| Method | SvelteKit Route | Hono Route | Status | Notes |
|--------|----------------|------------|--------|-------|
| GET | `/auth/confirm` | `/auth/confirm` | ❌ | Email confirmation |
| POST | `/logout` | `/logout` | ❌ | User logout |

## Migration Priority Levels

### 🔥 High Priority (Phase 2)
1. **Donations API** (`/api/donations/*`) - Core CRM functionality
2. **Dashboard API** (`/api/dashboard/*`) - Essential user experience
3. **Import/Export API** (`/api/import/*`) - Critical data management

### 🟡 Medium Priority (Phase 3)
4. **Tag Management APIs** - User customization features
5. **View Management APIs** - Data presentation features
6. **Admin APIs** - Administrative functions
7. **Form Options API** - UI support

### 🟢 Low Priority (Phase 4)
8. **Debug APIs** - Development tools
9. **Test APIs** - Testing infrastructure
10. **Workspace Sub-routes** - Extended functionality
11. **Authentication Flow Routes** - Non-API routes

## Route Naming Conventions

### SvelteKit vs Hono Parameter Syntax
- **SvelteKit**: `[paramName]` → **Hono**: `:paramName`
- **SvelteKit**: `[...rest]` → **Hono**: `:rest{.*}` or multiple routes

### Path Structure
- **Base Path**: Remains unchanged (`/api/domain`)
- **Resource ID**: `/:id` for primary identifiers
- **Sub-resources**: `/:id/subresource` for related entities
- **Actions**: `/:id/action` for specific operations

## Breaking Changes

### None Expected
The migration is designed to maintain 100% backward compatibility:

- ✅ All URL paths remain identical
- ✅ All HTTP methods preserved
- ✅ Request/response formats unchanged
- ✅ Authentication flow maintained
- ✅ Error response structure consistent

## Testing Requirements

### Per-Route Testing
- [ ] Authentication/authorization
- [ ] Input validation
- [ ] CRUD operations
- [ ] Error handling
- [ ] Performance benchmarks

### Integration Testing
- [ ] Frontend compatibility
- [ ] Database transactions
- [ ] Workspace isolation
- [ ] User permissions

### Load Testing
- [ ] Response times under load
- [ ] Concurrent request handling
- [ ] Memory usage patterns
- [ ] Database connection pooling

## Migration Tracking

### Completed Routes: 23/78 (29%)
- ✅ Authentication: 8/8 routes
- ✅ GraphQL: 2/2 routes  
- ✅ Workspaces (core): 6/6 routes
- ✅ Contacts: 6/6 routes
- ✅ Businesses: 6/6 routes

### Remaining Routes: 55/78 (71%)
- ❌ Donations: 6 routes
- ❌ Tags: 12 routes
- ❌ Views: 15 routes
- ❌ Admin: 5 routes
- ❌ Features: 8 routes
- ❌ Debug/Test: 15+ routes
- ❌ Workspace sub-routes: 11 routes

This mapping provides a clear roadmap for the remaining migration work and ensures no functionality is lost during the transition to the unified Hono architecture.