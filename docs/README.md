# Civics Lab Documentation

Welcome to the comprehensive documentation for Civics Lab, a civic engagement management platform built with SvelteKit and Supabase.

## Project Overview

Civics Lab is a web application designed to help organizations manage civic engagement efforts. It provides tools for managing contacts, businesses, donations, and other aspects of civic campaigns within a multi-workspace environment.

### Tech Stack

- **Frontend**: SvelteKit 2.16.0 with Svelte 5
- **Styling**: TailwindCSS 4.0
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Hono.js for API routes
- **Deployment**: Vercel
- **Language**: TypeScript

## Documentation Structure

This documentation is organized into the following sections:

### 📐 Architecture
Documentation covering the overall system design and structure.

- [Application Structure](./architecture/app-structure.md) - Complete overview of the application architecture
- [CRM System](./architecture/crm.md) - Customer Relationship Management system documentation
- [Database Structure](./architecture/database.md) - Comprehensive database schema documentation

### 🔌 API
API-related documentation including routes, endpoints, and integration guides.

- [API Migration Guide](./api/API_MIGRATION_SVELTEKIT_TO_HONO.md) - Migration from SvelteKit to Hono API
- [API Route Mapping](./api/API_ROUTE_MAPPING.md) - Complete mapping of all API endpoints
- [API Testing](./api/API_TESTING.md) - Testing strategies and examples
- [Hono Implementation Guide](./api/HONO_IMPLEMENTATION_GUIDE.md) - Guide for implementing Hono.js APIs
- [Business API](./api/README-business-api.md) - Business management API documentation
- [Contact API](./api/README-contact-api.md) - Contact management API documentation
- [Donation API](./api/README-donation-api.md) - Donation tracking API documentation
- [Donation API Integration](./api/README-donation-api-integration.md) - Integration guide for donations

### 🗄️ Database
Database-related documentation including schema updates and migrations.

- [Database Updates](./database/database-updates.md) - Recent database schema changes and updates

### ✨ Features
Documentation for specific features and functionality.

- [Import System](./features/IMPORT_SYSTEM.md) - Data import functionality
- [Interaction Streams](./features/INTERACTION_STREAMS_README.md) - Activity tracking system
- [Invite System](./features/INVITE_SYSTEM.md) - User invitation management
- [SendGrid Integration](./features/SENDGRID_INVITE_IMPLEMENTATION.md) - Email service integration
- [SendGrid Setup](./features/SENDGRID_SETUP_GUIDE.md) - Email service configuration
- [Tag Autocomplete](./features/TAG_AUTOCOMPLETE_README.md) - Tag management system
- [Workspace Creation](./features/WORKSPACE_CREATION.md) - Multi-tenancy workspace system
- [Workspace Implementation](./features/WORKSPACE_IMPLEMENTATION.md) - Workspace feature implementation
- [Workspace Service Flags](./features/WORKSPACE_SERVICE_FLAGS_IMPLEMENTATION.md) - Service configuration flags
- [Business API Updates](./features/business-api-updates.md) - Business management enhancements
- [CRM Updates](./features/crm-updates.md) - Contact management improvements
- [Donation Schema Update](./features/donation-schema-update.md) - Donation system enhancements
- [Donation Tracking](./features/donation-tracking.md) - Donation management system
- [Donation Views Implementation](./features/donation-views-implementation.md) - Donation display views
- [Workspace Management](./features/workspace-management.md) - Workspace administration

### 🔧 Fixes
Documentation of bug fixes and problem resolutions.

- [Business Pagination](./fixes/BUSINESSES_PAGINATION_IMPLEMENTATION.md) - Business list pagination fixes
- [Business Import Error Fix](./fixes/BUSINESSES_IMPORT_ERROR_FIX.md) - Import system error resolution
- [Component Unification](./fixes/COMPONENT_UNIFICATION_FINAL.md) - UI component standardization
- [Contact Filter Sort Fix](./fixes/CONTACTS_FILTER_SORT_FIX.md) - Contact filtering improvements
- [Server-side Fixes](./fixes/SERVER_SIDE_FIXES_APPLIED.md) - Backend performance improvements
- [Pagination Implementation](./fixes/PAGINATION_IMPLEMENTATION.md) - Pagination system enhancements

### 📚 Guides
Step-by-step guides and tutorials.

- [Debugging Guide](./guides/DEBUGGING_GUIDE.md) - Troubleshooting and debugging strategies
- [Migration Testing Guide](./guides/MIGRATION_TESTING_GUIDE.md) - Database migration testing procedures

### 🔄 Migrations
Database migration scripts and procedures.

- [Donation Tags Migration](./migrations/donation-tags-migration.md) - Migration for donation tagging system
- [Donation Views Migration](./migrations/donation-views-migration.md) - Migration for donation display views
- [Fix Donation Views Table](./migrations/fix-donation-views-table.md) - Database table repair procedures

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (via Supabase)
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env.local`)
4. Run database migrations: `npm run db:setup`
5. Start development server: `npm run dev`

### Key Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview                # Preview production build

# Database
npm run db:generate            # Generate database schema
npm run db:migrate             # Run migrations
npm run db:studio              # Open database studio
npm run db:seed                # Seed database with initial data
npm run db:setup               # Full database setup (generate + migrate + seed)

# Type Checking
npm run check                  # Run type checking
npm run check:watch            # Run type checking in watch mode
```

## Project Structure

```
civics-lab-svelte/
├── src/
│   ├── app.html                    # Root HTML template
│   ├── app.css                     # Global styles
│   ├── hooks.server.ts             # Server-side hooks
│   ├── lib/                        # Shared utilities and components
│   │   ├── auth/                   # Authentication utilities
│   │   ├── components/             # Reusable UI components
│   │   │   ├── businesses/         # Business management components
│   │   │   ├── contacts/           # Contact management components
│   │   │   ├── donations/          # Donation tracking components
│   │   │   ├── import/             # Data import components
│   │   │   ├── marketing-site/     # Marketing site components
│   │   │   └── shared/             # Shared UI components
│   │   ├── config/                 # Configuration files
│   │   ├── db/                     # Database utilities and migrations
│   │   ├── middleware/             # Server middleware
│   │   ├── server/                 # Server-side utilities
│   │   ├── services/               # Service layer for data operations
│   │   ├── stores/                 # Svelte stores for state management
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/                  # Utility functions
│   └── routes/                     # Application routes
│       ├── (marketing)/            # Marketing site pages
│       ├── api/                    # API endpoints
│       ├── app/                    # Main application pages
│       ├── auth/                   # Authentication pages
│       ├── login/                  # Login page
│       ├── logout/                 # Logout functionality
│       └── signup/                 # Registration page
├── static/                         # Static assets
├── docs/                          # Documentation (this folder)
├── drizzle/                       # Database migrations
├── scripts/                       # Utility scripts
├── supabase/                      # Supabase configuration
└── postman/                       # API testing collections
```

## Core Features

### Multi-Workspace Management
- Support for multiple organizations/campaigns
- Role-based access control (Super Admin, Admin, Basic User, Volunteer)
- Workspace-specific data isolation

### Contact Management
- Comprehensive contact profiles with multiple contact methods
- Advanced filtering, sorting, and custom views
- Tag-based organization and categorization
- Import/export functionality

### Business Management
- Business entity tracking with employee relationships
- Multi-location support with address management
- Social media account tracking

### Donation Tracking
- Record donations from individuals and businesses
- Status tracking (promised, donated, processing, cleared)
- Reporting and analytics

### Activity Tracking
- Interaction streams for tracking user activities
- Timeline views of recent actions
- Audit trails for data changes

## Contributing

When contributing to this project:

1. Follow the existing code style and conventions
2. Update documentation for any new features
3. Add tests for new functionality
4. Ensure all existing tests pass
5. Update the appropriate documentation files in this `/docs` folder

## Support and Maintenance

This project includes comprehensive documentation for:

- System architecture and design decisions
- API endpoints and integration guides  
- Database schema and migration procedures
- Feature implementation details
- Bug fixes and problem resolution
- Testing strategies and procedures

For questions or issues, refer to the relevant documentation section or the debugging guide.

## License

[Add license information here]

---

*Last updated: October 2024*
*Documentation version: 1.0*
