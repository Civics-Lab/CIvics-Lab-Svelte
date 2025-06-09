-- Add Global Super Admin column to users table
-- Run this migration if the is_global_super_admin column doesn't exist

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'is_global_super_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_global_super_admin BOOLEAN DEFAULT FALSE NOT NULL;
    RAISE NOTICE 'Added is_global_super_admin column to users table';
  ELSE
    RAISE NOTICE 'is_global_super_admin column already exists';
  END IF;
END $$;

-- Optional: Create an index for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_global_super_admin 
ON users (is_global_super_admin) 
WHERE is_global_super_admin = true;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'is_global_super_admin';
