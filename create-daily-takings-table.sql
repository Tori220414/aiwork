-- Create Daily Takings table for Hospitality Workspace
-- Run this in your Supabase SQL Editor

-- ============================================
-- DAILY TAKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_takings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week_starting TIMESTAMP WITH TIME ZONE NOT NULL,
  week_ending TIMESTAMP WITH TIME ZONE NOT NULL,
  days JSONB NOT NULL DEFAULT '[]',
  weekly_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for daily_takings
CREATE INDEX IF NOT EXISTS idx_daily_takings_workspace_id ON daily_takings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_daily_takings_status ON daily_takings(status);
CREATE INDEX IF NOT EXISTS idx_daily_takings_week_starting ON daily_takings(week_starting);
CREATE INDEX IF NOT EXISTS idx_daily_takings_created_by ON daily_takings(created_by);

-- Enable Row Level Security for daily_takings
ALTER TABLE daily_takings ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_takings
CREATE POLICY "Users can view their workspace daily takings"
  ON daily_takings FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create daily takings for their workspaces"
  ON daily_takings FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace daily takings"
  ON daily_takings FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace daily takings"
  ON daily_takings FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Verify the table was created
SELECT 'Daily Takings table created successfully!' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_takings');
