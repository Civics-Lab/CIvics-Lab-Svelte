-- Create a new table called "Testing Kevin"
CREATE TABLE public."Testing Kevin" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    workspace_id UUID REFERENCES public.workspaces(id)
);

-- Add comment to the table
COMMENT ON TABLE public."Testing Kevin" IS 'Test table created by Kevin';

-- Enable RLS
ALTER TABLE public."Testing Kevin" ENABLE ROW LEVEL SECURITY;

-- Create policies to align with other tables
CREATE POLICY "Users can view records in their workspaces" 
ON public."Testing Kevin" 
FOR SELECT 
USING (
    workspace_id IN ( 
        SELECT workspaces.id FROM workspaces WHERE workspaces.created_by = auth.uid()
        UNION 
        SELECT user_workspaces.workspace_id FROM user_workspaces WHERE user_workspaces.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert records in their workspaces" 
ON public."Testing Kevin" 
FOR