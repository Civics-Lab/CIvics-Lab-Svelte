-- Migration: Add Recurring Donations and ActBlue Integration
-- Created: 2025-10-13
-- Description: Adds products, subscriptions, ActBlue config, webhook logs, and imports tables

-- ============================================================================
-- 1. CREATE NEW ENUMS
-- ============================================================================

-- Product billing period enum
DO $$ BEGIN
  CREATE TYPE product_billing_period AS ENUM ('one_time', 'weekly', 'monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Subscription status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'paused', 'failed', 'pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ActBlue event type enum
DO $$ BEGIN
  CREATE TYPE actblue_event_type AS ENUM ('donation', 'refund', 'cancellation');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. CREATE PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  billing_period product_billing_period NOT NULL DEFAULT 'one_time',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================================================
-- 3. CREATE SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  status subscription_status NOT NULL DEFAULT 'pending',
  start_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  billing_period product_billing_period NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  actblue_order_number TEXT,
  recurring_duration INTEGER, -- NULL means infinite
  recurring_completed INTEGER DEFAULT 0,
  weekly_recurring_sunset DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE ACTBLUE CONFIG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS actblue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  client_uuid TEXT,
  client_secret_encrypted TEXT,
  webhook_url TEXT,
  webhook_username TEXT,
  webhook_password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================================================
-- 5. CREATE ACTBLUE WEBHOOK LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS actblue_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type actblue_event_type NOT NULL,
  actblue_order_number TEXT,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. CREATE ACTBLUE IMPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS actblue_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL, -- 'webhook', 'csv'
  filename TEXT,
  csv_type TEXT, -- 'paid_contributions', 'refunded_contributions', etc.
  date_range_start DATE,
  date_range_end DATE,
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id)
);

-- ============================================================================
-- 7. ALTER DONATIONS TABLE - ADD NEW COLUMNS
-- ============================================================================

-- Add product_id column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add subscription_id column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add is_recurring column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add recurring_period column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS recurring_period TEXT DEFAULT 'once';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add recurrence_number column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS recurrence_number INTEGER;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add actblue_order_number column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS actblue_order_number TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add actblue_lineitem_id column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS actblue_lineitem_id TEXT UNIQUE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add actblue_payment_id column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS actblue_payment_id TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add actblue_donor_id column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS actblue_donor_id TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add actblue_data column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS actblue_data JSONB;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add external_source column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS external_source TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add refunded_at column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add disbursed_at column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add recovered_at column
DO $$ BEGIN
  ALTER TABLE donations ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================================
-- 8. CREATE INDEXES
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_workspace_id ON products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_billing_period ON products(billing_period);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_id ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_contact_id ON subscriptions(contact_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id ON subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_actblue_order ON subscriptions(actblue_order_number);

-- ActBlue config indexes
CREATE INDEX IF NOT EXISTS idx_actblue_config_workspace_id ON actblue_config(workspace_id);

-- ActBlue webhook logs indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_workspace_id ON actblue_webhook_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON actblue_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_number ON actblue_webhook_logs(actblue_order_number);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON actblue_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON actblue_webhook_logs(event_type);

-- ActBlue imports indexes
CREATE INDEX IF NOT EXISTS idx_actblue_imports_workspace_id ON actblue_imports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_actblue_imports_status ON actblue_imports(status);
CREATE INDEX IF NOT EXISTS idx_actblue_imports_created_at ON actblue_imports(created_at DESC);

-- Donations new column indexes
CREATE INDEX IF NOT EXISTS idx_donations_product_id ON donations(product_id);
CREATE INDEX IF NOT EXISTS idx_donations_subscription_id ON donations(subscription_id);
CREATE INDEX IF NOT EXISTS idx_donations_actblue_lineitem ON donations(actblue_lineitem_id);
CREATE INDEX IF NOT EXISTS idx_donations_actblue_order ON donations(actblue_order_number);
CREATE INDEX IF NOT EXISTS idx_donations_external_source ON donations(external_source);
CREATE INDEX IF NOT EXISTS idx_donations_is_recurring ON donations(is_recurring);

-- ============================================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE products IS 'Donation products/tiers that contacts can subscribe to';
COMMENT ON TABLE subscriptions IS 'Recurring subscription records for contacts';
COMMENT ON TABLE actblue_config IS 'ActBlue API credentials and webhook configuration per workspace';
COMMENT ON TABLE actblue_webhook_logs IS 'Audit log of all incoming ActBlue webhooks';
COMMENT ON TABLE actblue_imports IS 'Track CSV import sessions from ActBlue';

COMMENT ON COLUMN donations.actblue_lineitem_id IS 'Unique ActBlue lineitem ID (idempotency key)';
COMMENT ON COLUMN donations.actblue_order_number IS 'ActBlue order number (e.g., AB999999)';
COMMENT ON COLUMN donations.recurrence_number IS 'Which payment in the recurring sequence (0-based)';
COMMENT ON COLUMN donations.actblue_data IS 'Full ActBlue webhook payload for this donation';
COMMENT ON COLUMN subscriptions.recurring_duration IS 'Total number of payments (NULL = infinite)';
COMMENT ON COLUMN subscriptions.recurring_completed IS 'Number of successful payments processed';

-- ============================================================================
-- Migration Complete
-- ============================================================================
