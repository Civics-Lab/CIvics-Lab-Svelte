# Claude Rules for Civics Lab Svelte

## Project Overview

**CIvics Lab Svelte** is a comprehensive CRM and civic engagement platform built for political campaigns, advocacy organizations, and civic groups.

## Tech Stack & Architecture

### Frontend

- **Framework**: SvelteKit 5 with TypeScript
- **Styling**: Tailwind CSS 4.0
- **Components**: Custom component library with shadcn/ui patterns
- **State Management**: Svelte stores for client-side state

### Backend

- **API Framework**: Hono.js (migrated from SvelteKit API routes)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT-based auth with bcrypt password hashing
- **Deployment**: Vercel with @sveltejs/adapter-vercel

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: `postgres` library with connection pooling
- **Schema**: Located at `src/lib/db/drizzle/schema.ts`
- **Migrations**: Custom migration system in `src/lib/db/migrations/`

## Core Features & Entities

### Multi-Tenant System

- **Workspaces**: Organization-level isolation
- **User Roles**: Super Admin, Admin, Basic User, Volunteer
- **Permissions**: Role-based access control

### CRM Functionality

- **Contacts**: Contact management with addresses, emails, phones, social media
- **Businesses**: Business directory with employee relationships
- **Donations**: Donation tracking with status management
- **Interaction Streams**: Activity tracking and engagement history

### Data Management

- **Import/Export**: CSV processing for bulk operations
- **Filtering & Sorting**: Server-side pagination and search
- **Duplicate Detection**: Built-in duplicate contact/business detection

## Development Guidelines

### Code Conventions

- Use TypeScript throughout the application
- Follow existing patterns in the codebase
- Maintain consistent naming conventions
- Use Drizzle ORM for all database operations

### Database Operations

- Always use the server-side database instance: `src/lib/server/db.ts`
- Follow the existing schema patterns in `schema.ts`
- Use proper enum types for status fields
- Implement proper foreign key relationships

### API Development

- Use Hono.js for all API routes in `src/routes/api/`
- Implement proper error handling and validation
- Use Zod schemas for request validation
- Follow existing route structure patterns

### Authentication & Security

- Use JWT tokens for authentication
- Implement role-based access control
- Never expose sensitive data in client-side code
- Follow existing auth patterns in `src/lib/auth/`

## Testing & Quality

- Run `npm run check` for TypeScript validation
- Use `npm run db:studio` for database inspection
- Test migrations with `npm run db:migrate`
- Follow existing service patterns for business logic

## File Structure Guidelines

- **Services**: Business logic in `src/lib/services/`
- **Types**: TypeScript definitions in `src/lib/types/`
- **Components**: Reusable UI in `src/lib/components/`
- **API Routes**: Hono handlers in `src/routes/api/`
- **Database**: Schema and migrations in `src/lib/db/`

## Important Notes

- This is a civic engagement platform - focus on features that help political campaigns and advocacy groups
- Maintain data integrity with proper validation
- Ensure multi-tenant isolation is preserved
- Follow existing patterns for consistency
- Always consider the CRM workflow when making changes
- Always verify work before claiming that it's complete and working
- Don't create files with 'real' or 'fixed' - just edit the file that needs it
- Don't create random test files - use or create the real test framework
- Don't make random dev scripts and commit them - ignore or remove after work is done
- Don't take shortcuts with mocks and intermix mocks with real data
- Don't skip the test triangle for new work that's being done
