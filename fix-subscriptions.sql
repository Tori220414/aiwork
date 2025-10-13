-- Fix existing subscription records with missing data
-- Run this in your Supabase SQL Editor

-- Update subscriptions that are missing plan_id and amount
UPDATE subscriptions
SET
  plan_id = 'pro_monthly',
  amount = 1099
WHERE plan_id IS NULL OR amount IS NULL OR amount = 0;

-- Update trial subscriptions with proper trial_end dates
-- Set trial_end to 30 days after created_at for trialing subscriptions
UPDATE subscriptions
SET trial_end = (created_at + INTERVAL '30 days')
WHERE status = 'trialing'
  AND trial_end IS NULL;

-- Update subscriptions with invalid period dates (epoch dates)
-- Set to reasonable defaults if they're showing as 1970
UPDATE subscriptions
SET
  current_period_start = created_at,
  current_period_end = (created_at + INTERVAL '1 month')
WHERE current_period_start < '2020-01-01'::timestamp
  OR current_period_end < '2020-01-01'::timestamp;

-- Verify the updates
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
ORDER BY created_at DESC;
