-- Create invite_status enum type
CREATE TYPE "invite_status" AS ENUM ('Pending', 'Accepted', 'Declined', 'Expired');

-- Create user_invites table
CREATE TABLE IF NOT EXISTS "user_invites" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "workspace_id" UUID REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "role" workspace_role DEFAULT 'Basic User',
  "status" invite_status DEFAULT 'Pending',
  "invited_by" UUID REFERENCES "users"("id"),
  "invited_at" TIMESTAMP DEFAULT NOW(),
  "expires_at" TIMESTAMP,
  "accepted_at" TIMESTAMP,
  "token" TEXT NOT NULL UNIQUE
);

-- Create indexes
CREATE INDEX "user_invites_email_idx" ON "user_invites"("email");
CREATE INDEX "user_invites_workspace_id_idx" ON "user_invites"("workspace_id");
CREATE INDEX "user_invites_status_idx" ON "user_invites"("status");
CREATE INDEX "user_invites_token_idx" ON "user_invites"("token");
