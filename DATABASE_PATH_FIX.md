# Database Import Path Fix

This document explains the fix for the 500 errors in various API endpoints related to incorrect database imports.

## Problem

When accessing certain API endpoints like `/api/contacts` or `/api/contact-views`, you were seeing 500 errors with the following error message in the logs:

```
Error fetching contacts: TypeError: __vite_ssr_import_1__.db.select is not a function
```

This error occurs because the database object was being imported from the wrong path in these API endpoints.

## Root Cause

The API endpoints were importing the database from `$lib/db/drizzle`:

```typescript
import { db } from '$lib/db/drizzle';
```

However, the correct import path for server-side database access should be:

```typescript
import { db } from '$lib/server/db';
```

The `$lib/db/drizzle` path doesn't exist in the codebase, causing the database methods like `select` to be undefined.

## Solution Implemented

We've fixed this issue by:

1. Updating the database import path in the auth utility
2. Updating the database import path in the contacts API endpoint
3. Updating the database import path in the contact-views API endpoint
4. Creating a script to automatically fix other API endpoints that might have the same issue

## How to Run the Fix Script

To fix all API endpoints with incorrect database imports, run:

```bash
# Make the script executable
chmod +x scripts/fix-db-imports.js

# Run the script
node scripts/fix-db-imports.js
```

This will scan all API endpoint files and update any incorrect database imports.

## What to Check After Fixing

After applying the fixes:

1. The contact-views API should work: `/api/contact-views?workspace_id=xxx`
2. The contacts API should work: `/api/contacts?workspace_id=xxx`
3. Other API endpoints that might have had similar issues should also be fixed

## Preventing This Issue in Future

To prevent this issue in the future:

1. Always use `$lib/server/db` for server-side database access
2. Set up ESLint rules to enforce correct import paths
3. Add documentation for developers about the correct database import paths
