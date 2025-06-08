-- Create enum for interaction types
CREATE TYPE "interaction_type" AS ENUM('note', 'call', 'email', 'in_person');

-- Create enum for interaction status
CREATE TYPE "interaction_status" AS ENUM('active', 'archived', 'deleted');

-- Create the interaction_streams table
CREATE TABLE IF NOT EXISTS "interaction_streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid REFERENCES "workspaces"("id"),
	"contact_id" uuid REFERENCES "contacts"("id"),
	"business_id" uuid REFERENCES "businesses"("id"),
	"interaction_type" "interaction_type" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"interaction_date" timestamp DEFAULT now() NOT NULL,
	"status" "interaction_status" DEFAULT 'active',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" uuid REFERENCES "users"("id"),
	"updated_by" uuid REFERENCES "users"("id"),
	CONSTRAINT "interaction_streams_entity_check" CHECK (
		("contact_id" IS NOT NULL AND "business_id" IS NULL) OR 
		("contact_id" IS NULL AND "business_id" IS NOT NULL)
	)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_interaction_streams_workspace_id" ON "interaction_streams" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_interaction_streams_contact_id" ON "interaction_streams" ("contact_id");
CREATE INDEX IF NOT EXISTS "idx_interaction_streams_business_id" ON "interaction_streams" ("business_id");
CREATE INDEX IF NOT EXISTS "idx_interaction_streams_interaction_date" ON "interaction_streams" ("interaction_date" DESC);
CREATE INDEX IF NOT EXISTS "idx_interaction_streams_created_at" ON "interaction_streams" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_interaction_streams_type" ON "interaction_streams" ("interaction_type");
CREATE INDEX IF NOT EXISTS "idx_interaction_streams_status" ON "interaction_streams" ("status");
