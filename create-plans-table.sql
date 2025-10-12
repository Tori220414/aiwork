-- Create plans table to store daily and weekly plans
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('daily', 'weekly')),
  plan_date DATE NOT NULL, -- For daily plans, or start date for weekly plans
  plan_data JSONB NOT NULL, -- The full plan object from AI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one plan per date per user
  UNIQUE(user_id, plan_type, plan_date)
);

-- Create plan_events table to track calendar events
CREATE TABLE IF NOT EXISTS plan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  task_title VARCHAR(500) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type VARCHAR(50), -- 'work', 'break', 'meeting', etc.
  notes TEXT,

  -- Calendar sync tracking
  outlook_event_id VARCHAR(500),
  google_event_id VARCHAR(500),
  synced_to_outlook BOOLEAN DEFAULT false,
  synced_to_google BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_plans_user_date ON plans(user_id, plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_plans_user_type_date ON plans(user_id, plan_type, plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_plan_events_plan_id ON plan_events(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_events_outlook ON plan_events(outlook_event_id) WHERE outlook_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plan_events_google ON plan_events(google_event_id) WHERE google_event_id IS NOT NULL;

-- Add RLS policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own plans
CREATE POLICY plans_user_policy ON plans
  FOR ALL
  USING (auth.uid() = user_id);

-- Users can only see events from their own plans
CREATE POLICY plan_events_user_policy ON plan_events
  FOR ALL
  USING (
    plan_id IN (
      SELECT id FROM plans WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_events_updated_at
  BEFORE UPDATE ON plan_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify tables created
SELECT 'Plans tables created successfully!' as status;
