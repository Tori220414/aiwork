-- Add missing columns to subscriptions table
-- Run this in your Supabase SQL Editor

-- Add plan_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='subscriptions' AND column_name='plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id TEXT DEFAULT 'pro_monthly';
  END IF;
END $$;

-- Add amount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='subscriptions' AND column_name='amount'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN amount INTEGER DEFAULT 1099;
  END IF;
END $$;

-- Add trial_end column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='subscriptions' AND column_name='trial_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add canceled_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='subscriptions' AND column_name='canceled_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN canceled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Now update existing records
UPDATE subscriptions
SET
  plan_id = COALESCE(plan_id, 'pro_monthly'),
  amount = CASE WHEN amount IS NULL OR amount = 0 THEN 1099 ELSE amount END
WHERE plan_id IS NULL OR amount IS NULL OR amount = 0;

-- Set trial_end for trialing subscriptions
UPDATE subscriptions
SET trial_end = (created_at + INTERVAL '30 days')
WHERE status = 'trialing'
  AND trial_end IS NULL;

-- Verify the schema
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Verify the data
SELECT
  id,
  user_id,
  status,
  plan_id,
  amount,
  current_period_start,
  current_period_end,
  trial_end,
  created_at
FROM subscriptions
ORDER BY created_at DESC
LIMIT 10;
