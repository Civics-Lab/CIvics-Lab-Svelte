-- Alternative migration approach - Drop and recreate if needed
-- Run this manually in your database if the automated migration fails

-- Drop existing problematic constraints if they exist
DO $$
BEGIN
    -- Drop foreign key constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'import_errors_import_session_id_import_sessions_id_fk') THEN
        ALTER TABLE import_errors DROP CONSTRAINT import_errors_import_session_id_import_sessions_id_fk;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'import_sessions_workspace_id_workspaces_id_fk') THEN
        ALTER TABLE import_sessions DROP CONSTRAINT import_sessions_workspace_id_workspaces_id_fk;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'import_sessions_created_by_users_id_fk') THEN
        ALTER TABLE import_sessions DROP CONSTRAINT import_sessions_created_by_users_id_fk;
    END IF;
END
$$;

-- Drop tables if they exist
DROP TABLE IF EXISTS import_errors;
DROP TABLE IF EXISTS import_sessions;

-- Drop enums if they exist
DROP TYPE IF EXISTS import_error_type;
DROP TYPE IF EXISTS import_mode;
DROP TYPE IF EXISTS import_status;
DROP TYPE IF EXISTS import_type;

-- Now create everything fresh
CREATE TYPE import_error_type AS ENUM('validation', 'duplicate', 'processing');
CREATE TYPE import_mode AS ENUM('create_only', 'update_or_create');
CREATE TYPE import_status AS ENUM('pending', 'processing', 'completed', 'failed');
CREATE TYPE import_type AS ENUM('contacts', 'businesses', 'donations');

-- Create import_sessions table
CREATE TABLE import_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
    import_type import_type NOT NULL,
    filename text NOT NULL,
    total_records integer NOT NULL,
    processed_records integer DEFAULT 0,
    successful_records integer DEFAULT 0,
    failed_records integer DEFAULT 0,
    status import_status DEFAULT 'pending',
    import_mode import_mode NOT NULL,
    duplicate_field text,
    field_mapping jsonb NOT NULL,
    error_log jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Create import_errors table
CREATE TABLE import_errors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    import_session_id uuid REFERENCES import_sessions(id) ON DELETE CASCADE,
    row_number integer NOT NULL,
    field_name text,
    error_type import_error_type,
    error_message text NOT NULL,
    raw_data jsonb,
    created_at timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_import_sessions_workspace_id ON import_sessions(workspace_id);
CREATE INDEX idx_import_sessions_status ON import_sessions(status);
CREATE INDEX idx_import_sessions_created_at ON import_sessions(created_at);
CREATE INDEX idx_import_errors_session_id ON import_errors(import_session_id);
CREATE INDEX idx_import_errors_row_number ON import_errors(import_session_id, row_number);

-- Enable RLS
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for import_sessions
CREATE POLICY "Users can view import sessions for their workspaces" ON import_sessions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create import sessions for their workspaces" ON import_sessions
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update import sessions for their workspaces" ON import_sessions
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for import_errors
CREATE POLICY "Users can view import errors for their sessions" ON import_errors
  FOR SELECT USING (
    import_session_id IN (
      SELECT id FROM import_sessions WHERE workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create import errors for their sessions" ON import_errors
  FOR INSERT WITH CHECK (
    import_session_id IN (
      SELECT id FROM import_sessions WHERE workspace_id IN (
        SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()
      )
    )
  );
