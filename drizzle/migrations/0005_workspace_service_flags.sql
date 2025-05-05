-- Add service flag columns to the workspaces table
ALTER TABLE "workspaces" 
ADD COLUMN "has_engage" boolean NOT NULL DEFAULT true,
ADD COLUMN "has_helpdesk" boolean NOT NULL DEFAULT false,
ADD COLUMN "has_pathway" boolean NOT NULL DEFAULT false,
ADD COLUMN "has_pulse" boolean NOT NULL DEFAULT false,
ADD COLUMN "has_compass" boolean NOT NULL DEFAULT false;

-- Update existing workspaces to have engage enabled by default
UPDATE "workspaces" SET "has_engage" = true;

-- Add a comment to explain the purpose of these columns
COMMENT ON COLUMN "workspaces"."has_engage" IS 'Controls access to the Engage CRM service';
COMMENT ON COLUMN "workspaces"."has_helpdesk" IS 'Controls access to the HelpDesk Support Ticket service';
COMMENT ON COLUMN "workspaces"."has_pathway" IS 'Controls access to the Pathway educational materials service';
COMMENT ON COLUMN "workspaces"."has_pulse" IS 'Controls access to the Pulse Community Forum service';
COMMENT ON COLUMN "workspaces"."has_compass" IS 'Controls access to the Compass Campaign Manager service';