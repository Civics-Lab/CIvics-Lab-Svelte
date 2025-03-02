// src/lib/types/supabase.ts
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '../../database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;

// Type safe way to get a table from our Database type
export type Table<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

// Commonly used table types
export type Workspace = Table<'workspaces'>;
export type UserWorkspace = Table<'user_workspaces'>;
export type Contact = Table<'contacts'>;
export type Business = Table<'businesses'>;

// View types
export type ActiveContact = Database['public']['Views']['active_contacts']['Row'];
export type ActiveBusiness = Database['public']['Views']['active_businesses']['Row'];

// Enum types
export type WorkspaceRole = Database['public']['Enums']['workspace_role'];
export type ContactStatus = Database['public']['Enums']['contact_status'];
export type BusinessStatus = Database['public']['Enums']['business_status'];