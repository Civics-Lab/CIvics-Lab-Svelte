# API Testing Guide

This document provides information on how to test the API endpoints using tools like Postman or curl.

## Setup

1. Make sure the server is running locally with `npm run dev`
2. Ensure you have a `.env` file with the required environment variables (see `.env.example`)

## Authentication Endpoints

### 1. Signup - `POST /api/auth/signup`

Creates a new user account and returns a JWT token.

**Request Body:**
```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123",
  "displayName": "Test User"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "username": "testuser",
      "email": "test@example.com",
      "displayName": "Test User",
      "role": "user"
    }
  }
}
```

### 2. Login - `POST /api/auth/login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "username": "testuser",
      "email": "test@example.com",
      "displayName": "Test User",
      "role": "user"
    }
  }
}
```

### 3. Validate Token - `POST /api/auth/validate`

Validates a JWT token and returns user information.

**Headers:**
- Authorization: Bearer [token]

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "uuid-here",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

## GraphQL Endpoint

### GraphQL API - `POST /api/graph`

This is the main endpoint for all data operations, using GraphQL queries and mutations.

**Headers:**
- Authorization: Bearer [token]
- Content-Type: application/json

**Request Body Example (Getting User Info):**
```json
{
  "query": "query { me { id username email role } }"
}
```

**Request Body Example (Creating a Workspace):**
```json
{
  "query": "mutation CreateWorkspace($input: WorkspaceInput!) { createWorkspace(input: $input) { id name slug } }",
  "variables": {
    "input": {
      "name": "Test Workspace",
      "slug": "test-workspace"
    }
  }
}
```

**Request Body Example (Getting Workspace Contacts):**
```json
{
  "query": "query GetContacts($workspaceId: ID!) { workspaceContacts(workspaceId: $workspaceId) { id firstName lastName email phone } }",
  "variables": {
    "workspaceId": "workspace-uuid-here"
  }
}
```

## Testing Flow

1. Create a user with the Signup endpoint
2. Log in with the Login endpoint and save the token
3. Use the token in the Authorization header for subsequent requests
4. Create a workspace using the GraphQL endpoint
5. Test other GraphQL operations using the saved token and workspace ID

## Common Issues

- **Authentication Errors**: Make sure your JWT token is valid and not expired
- **Permission Errors**: Ensure your user has the right permissions for the requested operation
- **Missing Workspace ID**: Most operations require a valid workspace ID to enforce multi-tenant isolation

## Database Schema

For reference, the application uses the following database schema:

- **users**: User accounts
- **workspaces**: Tenant workspaces
- **workspace_users**: Junction table for workspace members
- **contacts**: Contact information
- **businesses**: Business information
- **donations**: Donation records

Each table includes appropriate foreign keys and timestamps.
