# Civics Lab Application Structure

This document provides an overview of the Civics Lab application architecture, built with SvelteKit.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Routes](#routes)
5. [Components](#components)
6. [State Management](#state-management)
7. [Database Integration](#database-integration)
8. [Authentication](#authentication)
9. [Deployment](#deployment)

## Overview

Civics Lab is a web application designed to help organize and manage civic engagement efforts. It provides tools for managing contacts, businesses, donations, and other aspects of civic campaigns. The application is built as a Single Page Application (SPA) using SvelteKit with a Supabase backend for database management and authentication.

## Tech Stack

- **Frontend Framework**: SvelteKit 2.16.0 (with Svelte 5)
- **UI/Styling**: TailwindCSS 4.0
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Icons**: Lucide Icons
- **Language**: TypeScript
- **Build Tool**: Vite

## Project Structure

The application follows SvelteKit's conventional structure:

```
civics-lab-svelte/
├── src/
│   ├── app.html            # Root HTML template
│   ├── app.css             # Global styles
│   ├── hooks.server.ts     # Server-side hooks
│   ├── lib/                # Shared utilities and components
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Svelte stores for state management
│   │   ├── types/          # TypeScript type definitions
│   │   ├── supabase.js     # Supabase client setup
│   │   └── services.ts     # Service functions for data operations
│   └── routes/             # Application routes
│       ├── (marketing)/    # Marketing site pages (grouped layout)
│       ├── app/            # Main application pages
│       ├── engage/         # Engagement functionality
│       ├── auth/           # Authentication pages
│       ├── api/            # API endpoints
│       ├── login/          # Login page
│       ├── logout/         # Logout functionality
│       └── signup/         # Signup page
├── static/                 # Static assets
├── supabase/               # Supabase configuration
├── database.types.ts       # Database type definitions
├── svelte.config.js        # SvelteKit configuration
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## Routes

The application is organized into several main route groups:

### Marketing Routes (`/src/routes/(marketing)/`)

Public-facing pages for marketing the application:
- `/` - Homepage
- `/about` - About page
- `/products` - Products information

### Application Routes (`/src/routes/app/`)

The main dashboard area for authenticated users.

### Engage Routes (`/src/routes/engage/`)

Tools for civic engagement:
- `/engage/contacts` - Contact management
- `/engage/businesses` - Business management
- `/engage/donations` - Donation tracking
- `/engage/settings` - Configuration settings

### Authentication Routes

- `/login` - User login
- `/logout` - User logout
- `/signup` - User registration
- `/auth/*` - Additional auth-related functionality

### API Routes (`/src/routes/api/`)

Backend functionality exposed as API endpoints:
- `/api/invite-user` - User invitation system

## Components

The application uses a component-based architecture with reusable UI elements:

### Core Components

- `Modal.svelte` - Base modal component
- `Toast.svelte` & `ToastContainer.svelte` - Notification system
- `LoadingSpinner.svelte` - Loading indicator
- `WorkspaceSelector.svelte` - Workspace selection UI
- `WorkspaceContext.svelte` - Context provider for workspace data

### Contact Components

- `ContactsDataGrid.svelte` - Data display for contacts
- `ContactDetailsSheet.svelte` - Detailed contact information
- `ContactFormModal.svelte` - Form for creating/editing contacts
- `ContactsFilterSortBar.svelte` - Filtering and sorting UI
- `ContactsViewModals.svelte` - View configuration modals
- `ContactsViewNavbar.svelte` - Navigation for contact views

### Contact Detail Components

- `ContactBasicInfo.svelte` - Basic contact information fields
- `ContactEmails.svelte` - Email management section
- `ContactPhones.svelte` - Phone number management section
- `ContactAddresses.svelte` - Address management section
- `ContactSocialMedia.svelte` - Social media account management
- `ContactTags.svelte` - Tag management section
- `ContactDonations.svelte` - Donation information for contacts

### Business Components

- `BusinessesDataGrid.svelte` - Data display for businesses
- `BusinessDetailsSheet.svelte` - Detailed business information
- `BusinessFormModal.svelte` - Form for creating/editing businesses
- `BusinessesFilterSortBar.svelte` - Filtering and sorting UI
- `BusinessesViewModals.svelte` - View configuration modals
- `BusinessesViewNavbar.svelte` - Navigation for business views

### Business Detail Components

- `BusinessBasicInfo.svelte` - Basic business information fields
- `BusinessAddresses.svelte` - Address management section
- `BusinessPhones.svelte` - Phone number management section
- `BusinessSocialMedia.svelte` - Social media account management
- `BusinessEmployees.svelte` - Employee relationship management
- `BusinessTags.svelte` - Tag management section
- `BusinessDonations.svelte` - Donation information for businesses

### Additional Components

- `DonationFormModal.svelte` - Form for recording donations
- `CreateWorkspaceModal.svelte` - Form for creating workspaces

## State Management

State management is handled through Svelte stores:

- `userStore.ts` - Manages authenticated user information
- `workspaceStore.ts` - Manages workspace selection and data
- `toastStore.ts` - Manages toast notifications

## Database Integration

The application integrates with a Supabase PostgreSQL database using the Supabase JavaScript client. Database operations are primarily handled through:

- `supabase.js` - Sets up the Supabase client
- `services.ts` - Contains service functions for data operations

Types for database entities are defined in:
- `database.types.ts` - TypeScript definitions for database schema
- `src/lib/types/supabase.ts` - Additional type definitions

## Authentication

Authentication is managed through Supabase Auth, utilizing:
- Email/password authentication
- Session management
- Protected routes via SvelteKit's server-side hooks

## Deployment

The application is configured for deployment on Vercel using:
- `@sveltejs/adapter-vercel` - SvelteKit adapter for Vercel
- `.vercel` directory - Vercel deployment settings
- Vercel Analytics and Speed Insights for monitoring

## Feature Modules

### Contact Management

Tools for managing individual contacts, including:
- Contact creation, editing, and deletion
- Contact details and history
- Contact filtering and searching
- Custom views for contact lists
- Contact tagging and categorization

### Business Management

Tools for managing business entities, including:
- Business creation, editing, and deletion
- Business details and contact information
- Employee relationship management
- Business filtering and searching
- Custom views for business lists

### Donation Tracking

Tools for recording and tracking donations:
- Donation recording
- Donation status tracking
- Donation reporting
- Donation display in contact and business details

### Workspace Management

Tools for managing organizational workspaces:
- Workspace creation and configuration
- User invitation and role management
- Workspace-specific data isolation

The application architecture follows modern best practices for web application development, with a clear separation of concerns, reusable components, and type safety through TypeScript.
