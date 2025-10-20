-- Migration: Add Team Workspaces Support
-- Description: Adds workspace types and member management for shared/team workspaces

-- Add workspace_type column to workspaces table
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS workspace_type VARCHAR(20) DEFAULT 'personal' CHECK (workspace_type IN ('personal', 'team'));

-- Create workspace_members table for team workspace membership
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role-based permissions
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),

  -- Metadata
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique membership per user per workspace
  UNIQUE(workspace_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(workspace_id, role);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(workspace_type);

-- Update trigger for workspace_members
CREATE OR REPLACE FUNCTION update_workspace_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_members_updated_at();

-- Add owner records for existing personal workspaces
-- This ensures all personal workspaces have the creator as owner
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT w.id, w.user_id, 'owner'
FROM workspaces w
WHERE w.workspace_type = 'personal'
  AND NOT EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = w.id AND wm.user_id = w.user_id
  )
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Comments for documentation
COMMENT ON COLUMN workspaces.workspace_type IS 'Type of workspace: personal (single user) or team (shared with multiple users)';
COMMENT ON TABLE workspace_members IS 'Tracks membership and roles for team workspaces';
COMMENT ON COLUMN workspace_members.role IS 'Member role: owner (full control), admin (manage members), member (read/write)';

-- Create a view for easy workspace access with member info
CREATE OR REPLACE VIEW workspace_access AS
SELECT
  w.*,
  wm.user_id AS member_user_id,
  wm.role AS member_role,
  wm.joined_at AS member_joined_at
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE w.is_archived = false;

COMMENT ON VIEW workspace_access IS 'Simplified view for querying workspace access with member information';
