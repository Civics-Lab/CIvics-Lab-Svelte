# Civics Lab SvelteKit Application

A multi-tenant web application for civic organizations built with SvelteKit, Drizzle ORM, PostgreSQL, and Hono.

## API Endpoints

This application uses Hono for API routes within the SvelteKit project. The API uses JWT for authentication and GraphQL for data operations.

### Authentication Endpoints

- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Authenticate a user
- `POST /api/auth/validate` - Validate a JWT token

### GraphQL Endpoint

- `POST /api/graph` - GraphQL API for all data operations

## Getting Started

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to `.env` and fill in the required values
   ```bash
   cp .env.example .env
   ```
4. Set up the database
   ```bash
   # Generate Drizzle migrations
   npm run db:generate
   
   # Apply migrations to the database
   npm run db:migrate
   
   # Seed the database with initial data
   npm run db:seed
   
   # Or do all of the above in one command
   npm run db:setup
   ```
   
5. Start the development server
   ```bash
   npm run dev
   ```

## Database Setup

This project uses Drizzle ORM with PostgreSQL. The database schema includes:

- User authentication tables for Hono JWT middleware
- Multi-tenant workspace organization
- Contact management
- Business tracking
- Donation records
- Reference tables for demographics, locations, etc.

### Database Commands

- `npm run db:generate` - Generate SQL migrations from schema changes
- `npm run db:migrate` - Apply migrations to the database
- `npm run db:seed` - Seed the database with initial data
- `npm run db:studio` - Launch Drizzle Studio to view/edit data
- `npm run db:setup` - Run generate, migrate, and seed in sequence

## Testing API Endpoints

You can test the API endpoints using:

1. Tools like Postman, Insomnia, or curl
2. GraphiQL - Available at `http://localhost:5173/api/graph` when in development mode

For detailed testing instructions, see [API_TESTING.md](API_TESTING.md).

## Multi-tenant Architecture

This application implements a multi-tenant architecture where:

- Each organization has its own workspace
- Users can belong to multiple workspaces with different roles
- Data is isolated at the workspace level
- GraphQL queries and mutations enforce proper permissions

## Database Schema

- **users** - User accounts for authentication
- **workspaces** - Tenant workspaces for organization separation
- **user_workspaces** - Junction table for workspace members with roles
- **contacts** - Contact information with demographic data
- **contact_emails/phones/addresses** - Contact details with status tracking
- **businesses** - Business information
- **donations** - Donation records from contacts or businesses
- **reference tables** - For states, counties, demographics, etc.

## API Authentication Flow

1. User registers or logs in to receive a JWT token
2. Client includes the JWT token in the Authorization header for all API requests
3. Protected routes validate the token and check permissions
4. GraphQL resolvers enforce data isolation based on workspace membership

## Development

To add new features:

1. Update the schema in `src/lib/db/drizzle/schema.ts`
2. Generate migrations with `npm run db:generate`
3. Apply migrations with `npm run db:migrate`
4. Add new GraphQL types to `src/routes/api/graph/schema.ts`
5. Implement resolvers in `src/routes/api/graph/resolvers.ts`
6. Test the new functionality using your preferred API testing tool

## Security Considerations

- All passwords are hashed with bcrypt
- JWT tokens are required for accessing protected routes
- Multi-tenant isolation is enforced at the database query level
- Role-based authorization controls access to resources
