-- Add missing fields to donations table
ALTER TABLE IF EXISTS "donations" 
ADD COLUMN IF NOT EXISTS "payment_type" text,
ADD COLUMN IF NOT EXISTS "notes" text;
