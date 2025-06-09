-- Migration: Add import tracking tables
-- Created: 2025-06-08

-- Import sessions table
CREATE TABLE IF NOT EXISTS import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  import_type VARCHAR(50) NOT NULL, -- 'contacts', 'businesses', 'donations'
  filename VARCHAR(255) NOT NULL,
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  import_mode VARCHAR(50) NOT NULL, -- 'create_only', 'update_or_create'
  duplicate_field VARCHAR(100), -- Field used for duplicate detection
  field_mapping JSONB NOT NULL,
  error_log JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import errors table for detailed error tracking
CREATE TABLE IF NOT EXISTS import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_session_id UUID REFERENCES import_sessions(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  field_name VARCHAR(100),
  error_type VARCHAR(50), -- 'validation', 'duplicate', 'processing'
  error_message TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_import_sessions_workspace_id ON import_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_created_at ON import_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_import_errors_session_id ON import_errors(import_session_id);
CREATE INDEX IF NOT EXISTS idx_import_errors_row_number ON import_errors(import_session_id, row_number);

-- Add RLS policies
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;

-- RLS policy for import_sessions - users can only see sessions for workspaces they have access to
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

-- RLS policy for import_errors - users can only see errors for sessions they have access to
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
