-- Add global Super Admin flag to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_global_super_admin" boolean DEFAULT false NOT NULL;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "action" text NOT NULL,
  "workspace_id" uuid REFERENCES "workspaces"("id"),
  "details" jsonb,
  "ip_address" text,
  "timestamp" timestamp DEFAULT now() NOT NULL
);