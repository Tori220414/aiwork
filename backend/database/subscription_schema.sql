-- Subscription Schema for Aurora Tasks
-- Free first month, then $10.99/month

-- Add subscription fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, canceled, past_due
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Subscriptions table for detailed tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe details
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Subscription info
  status VARCHAR(50) DEFAULT 'trial', -- trial, active, canceled, past_due, incomplete
  plan_name VARCHAR(100) DEFAULT 'Aurora Tasks Pro',
  amount DECIMAL(10, 2) DEFAULT 10.99,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Dates
  trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trial_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe details
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),

  -- Payment info
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- succeeded, pending, failed
  payment_method VARCHAR(50), -- card, bank_transfer, etc.

  -- Metadata
  receipt_url TEXT,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status VARCHAR(50);
  v_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT status, trial_end_date INTO v_status, v_trial_end
  FROM users
  WHERE id = p_user_id;

  -- User is on trial and trial hasn't ended
  IF v_status = 'trial' AND v_trial_end > NOW() THEN
    RETURN TRUE;
  END IF;

  -- User has active subscription
  IF v_status = 'active' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update subscription updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Set trial for existing users
UPDATE users
SET
  subscription_status = 'trial',
  subscription_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '30 days'
WHERE subscription_status IS NULL;

-- Create subscription record for existing users
INSERT INTO subscriptions (user_id, status, trial_start, trial_end)
SELECT
  id,
  'trial',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE subscriptions.user_id = users.id
);

COMMENT ON TABLE subscriptions IS 'User subscription tracking - Free 30-day trial, then $10.99/month';
COMMENT ON TABLE payments IS 'Payment history and invoices';
