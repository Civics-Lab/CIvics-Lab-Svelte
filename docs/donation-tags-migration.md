# Donation Tags Table Migration Guide

## Issue

The error "Failed to load donation details: Failed to fetch donation tags" indicates that the database is missing the required `donation_tags` table which is essential for the donation tags functionality to work properly.

## Solution

There are two ways to fix this issue:

### Option 1: Run the SQL Migration Script

The easiest way is to apply the migration script created for this purpose:

1. Make sure your database connection is properly configured in the `.env` file
2. Run the migration command:
   ```bash
   npm run db:migrate
   ```

This will apply all pending migrations, including the one that creates the `donation_tags` table.

### Option 2: Execute the SQL Directly

If you prefer, you can execute the SQL directly on your database:

1. Connect to your PostgreSQL database using a client (pgAdmin, psql, etc.)
2. Execute the following SQL:
   ```sql
   CREATE TABLE IF NOT EXISTS "donation_tags" (
     "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     "donation_id" uuid REFERENCES "donations"("id") ON DELETE CASCADE,
     "tag" text NOT NULL,
     "created_at" timestamp DEFAULT now()
   );
   
   CREATE INDEX IF NOT EXISTS "donation_tags_donation_id_idx" ON "donation_tags"("donation_id");
   ```

### Verification

After applying the fix:

1. Navigate to a donation's details page
2. The tags section should now work properly
3. You should be able to add, edit, and delete tags

## Background

The donation tags feature allows you to categorize donations for easier filtering and reporting. Tags can be anything that helps you organize donations, such as "annual", "corporate", "major donor", or campaign-specific tags.

Each tag is associated with a specific donation and stored in the `donation_tags` table. The table has a foreign key relationship with the `donations` table to ensure data integrity - when a donation is deleted, all its associated tags are deleted as well (CASCADE behavior).

## Troubleshooting

If you encounter issues after applying the migration:

1. Check that the migration ran successfully:
   ```bash
   psql -c "SELECT table_name FROM information_schema.tables WHERE table_name = 'donation_tags';"
   ```
   
2. Verify that the table structure is correct:
   ```bash
   psql -c "\d donation_tags"
   ```
   
3. Check for any constraint violations:
   ```bash
   psql -c "SELECT * FROM pg_constraint WHERE conrelid = 'donation_tags'::regclass;"
   ```

4. If you still encounter issues, please check the application logs for more specific error messages.