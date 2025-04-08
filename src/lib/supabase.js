// This file is being phased out as we transition from Supabase to Drizzle
// It's kept for compatibility with existing code but will be removed in the future
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Add a warning log for developers
console.warn('Warning: Using legacy Supabase client which is being phased out. Please transition to using the Drizzle-based API.');