-- Simple import system migration
-- Create import-specific enums
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

-- Create indexes for better performance
CREATE INDEX idx_import_sessions_workspace_id ON import_sessions(workspace_id);
CREATE INDEX idx_import_sessions_status ON import_sessions(status);
CREATE INDEX idx_import_sessions_created_at ON import_sessions(created_at);
CREATE INDEX idx_import_errors_session_id ON import_errors(import_session_id);
