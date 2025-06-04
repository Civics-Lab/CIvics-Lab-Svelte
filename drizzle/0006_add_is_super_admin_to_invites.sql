-- Add isSuperAdmin field to user_invites table
ALTER TABLE "user_invites" ADD COLUMN IF NOT EXISTS "is_super_admin" boolean DEFAULT false NOT NULL;
