DO $$ BEGIN
 CREATE TYPE "public"."invite_status" AS ENUM('Pending', 'Accepted', 'Declined', 'Expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create the user_invites table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "workspace_id" uuid REFERENCES "workspaces"("id"),
  "role" "workspace_role" DEFAULT 'Basic User',
  "status" "invite_status" DEFAULT 'Pending',
  "invited_by" uuid REFERENCES "users"("id"),
  "invited_at" timestamp DEFAULT now(),
  "expires_at" timestamp,
  "accepted_at" timestamp,
  "token" text NOT NULL UNIQUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "user_invites_email_idx" ON "user_invites" ("email");
CREATE INDEX IF NOT EXISTS "user_invites_workspace_id_idx" ON "user_invites" ("workspace_id");
CREATE INDEX IF NOT EXISTS "user_invites_token_idx" ON "user_invites" ("token");
