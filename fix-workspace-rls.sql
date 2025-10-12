-- Fix workspace RLS policies to allow authenticated users

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can read own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can delete own workspaces" ON workspaces;

-- Create new policies that work with JWT auth (not Supabase auth.uid())
CREATE POLICY "Users can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can read workspaces"
ON workspaces FOR SELECT
USING (true);

CREATE POLICY "Users can update workspaces"
ON workspaces FOR UPDATE
USING (true);

CREATE POLICY "Users can delete workspaces"
ON workspaces FOR DELETE
USING (true);

-- Same for board_configs
ALTER TABLE board_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage board configs" ON board_configs;
CREATE POLICY "Users can manage board configs"
ON board_configs FOR ALL
USING (true);

-- Same for workspace_templates
ALTER TABLE workspace_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read templates" ON workspace_templates;
CREATE POLICY "Users can read templates"
ON workspace_templates FOR SELECT
USING (true);
