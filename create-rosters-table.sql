-- Create Rosters table for Hospitality Workspace
-- Run this in your Supabase SQL Editor

-- ============================================
-- ROSTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week_starting TIMESTAMP WITH TIME ZONE NOT NULL,
  week_ending TIMESTAMP WITH TIME ZONE NOT NULL,
  shifts JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rosters
CREATE INDEX IF NOT EXISTS idx_rosters_workspace_id ON rosters(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rosters_status ON rosters(status);
CREATE INDEX IF NOT EXISTS idx_rosters_week_starting ON rosters(week_starting);
CREATE INDEX IF NOT EXISTS idx_rosters_created_by ON rosters(created_by);

-- Enable Row Level Security for rosters
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;

-- Create policies for rosters
CREATE POLICY "Users can view their workspace rosters"
  ON rosters FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rosters for their workspaces"
  ON rosters FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace rosters"
  ON rosters FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace rosters"
  ON rosters FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Verify the table was created
SELECT 'Rosters table created successfully!' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rosters');
