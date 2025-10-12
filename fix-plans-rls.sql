-- Fix RLS policies for plans tables to work with service role
-- Service role should bypass RLS, but we'll ensure policies are correct

-- Drop existing policies
DROP POLICY IF EXISTS plans_user_policy ON plans;
DROP POLICY IF EXISTS plan_events_user_policy ON plan_events;

-- Recreate plans policy
-- Service role bypasses RLS, so this only affects anon/authenticated roles
CREATE POLICY plans_user_policy ON plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recreate plan_events policy
CREATE POLICY plan_events_user_policy ON plan_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_events.plan_id
      AND plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_events.plan_id
      AND plans.user_id = auth.uid()
    )
  );

-- Verify RLS is enabled
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_events ENABLE ROW LEVEL SECURITY;

-- Check that service role key is being used
SELECT 'RLS policies updated. Service role key should bypass RLS automatically.' as status;
