# How to Fix the Missing Donation Views Table

## Problem

The application is encountering an error because the `donation_views` table doesn't exist in the database:

```
Error fetching views: Error: Failed to fetch donation views: relation "donation_views" does not exist
```

This table is necessary for the donations view selector to work properly.

## Solution

We've added the necessary migration file to create the missing table. Follow these steps to fix the issue:

### Option 1: Apply the Migration Using Drizzle

1. Make sure you have the latest code with the new migration files:
   - `/drizzle/0001_donation_views_table.sql`
   - `/drizzle/meta/_journal.json` (updated)
   - `/drizzle/meta/0001_snapshot.json` (new)

2. Run the migration command:
   ```bash
   npm run drizzle:migrate
   ```
   or
   ```bash
   npx drizzle-kit migrate
   ```

3. Restart your application.

### Option 2: Execute the SQL Directly

If you prefer to execute the SQL directly on your database:

1. Connect to your PostgreSQL database using a client (pgAdmin, psql, etc.)

2. Execute the following SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS "donation_views" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
     "view_name" text NOT NULL,
     "workspace_id" uuid,
     "amount" boolean DEFAULT true,
     "status" boolean DEFAULT true,
     "payment_type" boolean DEFAULT true,
     "notes" boolean DEFAULT false,
     "filters" jsonb,
     "sorting" jsonb,
     "created_at" timestamp DEFAULT now(),
     "updated_at" timestamp DEFAULT now(),
     "created_by" uuid
   );

   ALTER TABLE "donation_views" 
     ADD CONSTRAINT "donation_views_workspace_id_workspaces_id_fk" 
     FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id");

   ALTER TABLE "donation_views" 
     ADD CONSTRAINT "donation_views_created_by_users_id_fk" 
     FOREIGN KEY ("created_by") REFERENCES "users"("id");

   CREATE INDEX IF NOT EXISTS "donation_views_workspace_id_idx" 
     ON "donation_views"("workspace_id");
   ```

3. Restart your application.

## Verification

After applying the fix:

1. Navigate to the Donations page in the application
2. The view selector should now work properly, showing you the "Default View"
3. You should be able to create, edit, and delete views

## Troubleshooting

If you still encounter issues after applying the migration:

1. Check the database logs for any errors during the migration
2. Verify that the `donation_views` table was created successfully:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'donation_views';
   ```
3. Make sure your application has the correct database connection string
4. Check the application logs for any other database-related errors
