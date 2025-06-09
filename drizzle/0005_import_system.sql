-- Manual import system migration
-- Only includes import-specific tables and enums

-- Create import-specific enums
DO $$ BEGIN
 CREATE TYPE "public"."import_error_type" AS ENUM('validation', 'duplicate', 'processing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."import_mode" AS ENUM('create_only', 'update_or_create');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."import_status" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."import_type" AS ENUM('contacts', 'businesses', 'donations');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create import_sessions table
CREATE TABLE IF NOT EXISTS "import_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"import_type" "import_type" NOT NULL,
	"filename" text NOT NULL,
	"total_records" integer NOT NULL,
	"processed_records" integer DEFAULT 0,
	"successful_records" integer DEFAULT 0,
	"failed_records" integer DEFAULT 0,
	"status" "import_status" DEFAULT 'pending',
	"import_mode" "import_mode" NOT NULL,
	"duplicate_field" text,
	"field_mapping" jsonb NOT NULL,
	"error_log" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" uuid
);

-- Create import_errors table
CREATE TABLE IF NOT EXISTS "import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_session_id" uuid,
	"row_number" integer NOT NULL,
	"field_name" text,
	"error_type" "import_error_type",
	"error_message" text NOT NULL,
	"raw_data" jsonb,
	"created_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_import_sessions_workspace_id" ON "import_sessions"("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_import_sessions_status" ON "import_sessions"("status");
CREATE INDEX IF NOT EXISTS "idx_import_sessions_created_at" ON "import_sessions"("created_at");
CREATE INDEX IF NOT EXISTS "idx_import_errors_session_id" ON "import_errors"("import_session_id");
CREATE INDEX IF NOT EXISTS "idx_import_errors_row_number" ON "import_errors"("import_session_id", "row_number");

-- Enable RLS on the tables
ALTER TABLE "import_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "import_errors" ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_sessions
CREATE POLICY IF NOT EXISTS "Users can view import sessions for their workspaces" ON "import_sessions"
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create import sessions for their workspaces" ON "import_sessions"
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update import sessions for their workspaces" ON "import_sessions"
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

-- RLS policies for import_errors
CREATE POLICY IF NOT EXISTS "Users can view import errors for their sessions" ON "import_errors"
  FOR SELECT USING (
    import_session_id IN (
      SELECT id FROM import_sessions WHERE workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create import errors for their sessions" ON "import_errors"
  FOR INSERT WITH CHECK (
    import_session_id IN (
      SELECT id FROM import_sessions WHERE workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
      )
    )
  );
