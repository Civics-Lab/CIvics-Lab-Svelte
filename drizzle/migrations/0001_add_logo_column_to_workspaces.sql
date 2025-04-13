-- Add logo column to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS logo TEXT;