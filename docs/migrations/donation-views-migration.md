# Donation Views Table Migration Guide

## Issue

The error `relation "donation_views" does not exist` indicates that the database is missing the required `donation_views` table which is essential for the donation view functionality to work properly.

## Solution

There are two ways to fix this issue:

### Option 1: Run the SQL Migration Script

1. Connect to your PostgreSQL database using a database client or command line.
2. Run the following SQL command to create the required table:

```sql
CREATE TABLE IF NOT EXISTS "donation_views" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "view_name" TEXT NOT NULL,
  "workspace_id" UUID REFERENCES "workspaces"("id"),
  "amount" BOOLEAN DEFAULT TRUE,
  "status" BOOLEAN DEFAULT TRUE,
  "payment_type" BOOLEAN DEFAULT TRUE,
  "notes" BOOLEAN DEFAULT FALSE,
  "filters" JSONB,
  "sorting" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "create