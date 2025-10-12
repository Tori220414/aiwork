-- Workspaces Schema for AI Task Master

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Layout and view settings
  default_view VARCHAR(50) DEFAULT 'kanban', -- kanban, list, calendar, timeline

  -- Customization
  theme VARCHAR(50) DEFAULT 'light', -- light, dark, custom
  background_type VARCHAR(50) DEFAULT 'color', -- color, gradient, image, pattern
  background_value TEXT, -- hex color, gradient CSS, image URL, or pattern name
  primary_color VARCHAR(7) DEFAULT '#3b82f6', -- hex color for primary theme
  secondary_color VARCHAR(7) DEFAULT '#8b5cf6', -- hex color for secondary theme

  -- Settings
  settings JSONB DEFAULT '{}', -- flexible settings storage
  is_default BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Board configurations table (for different view types within a workspace)
CREATE TABLE IF NOT EXISTS board_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  view_type VARCHAR(50) NOT NULL, -- kanban, list, calendar, timeline
  name VARCHAR(255) NOT NULL,

  -- View-specific configuration
  config JSONB DEFAULT '{}', -- stores view-specific settings

  -- For Kanban: column definitions
  -- For List: grouping and sorting preferences
  -- For Calendar: date field to use, view mode (month/week/day)
  -- For Timeline: start/end date fields, display settings

  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace templates table (AI-generated and predefined)
CREATE TABLE IF NOT EXISTS workspace_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- personal, work, team, education, health, finance, custom

  -- Template configuration
  default_view VARCHAR(50) DEFAULT 'kanban',
  theme VARCHAR(50) DEFAULT 'light',
  background_type VARCHAR(50) DEFAULT 'color',
  background_value TEXT,
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) DEFAULT '#8b5cf6',

  -- Template structure
  board_configs JSONB DEFAULT '[]', -- predefined board configurations
  sample_tasks JSONB DEFAULT '[]', -- optional sample tasks for the template

  -- AI generation tracking
  is_ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- the prompt used to generate this template

  -- Visibility
  is_public BOOLEAN DEFAULT false, -- public templates available to all users
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- null for system templates

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link tasks to specific workspaces
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_default ON workspaces(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_board_configs_workspace ON board_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_templates_category ON workspace_templates(category);
CREATE INDEX IF NOT EXISTS idx_workspace_templates_public ON workspace_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workspaces_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspaces_updated_at();

CREATE TRIGGER update_board_configs_updated_at
  BEFORE UPDATE ON board_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_workspaces_updated_at();

CREATE TRIGGER update_workspace_templates_updated_at
  BEFORE UPDATE ON workspace_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_workspaces_updated_at();

-- Insert default system templates
INSERT INTO workspace_templates (name, description, category, is_public, default_view, theme, background_type, background_value, primary_color, board_configs)
VALUES
  (
    'Personal Productivity',
    'Simple workspace for managing personal tasks and goals',
    'personal',
    true,
    'kanban',
    'light',
    'gradient',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '#667eea',
    '[{"view_type": "kanban", "name": "My Tasks", "config": {"columns": [{"id": "pending", "title": "To Do"}, {"id": "in-progress", "title": "In Progress"}, {"id": "completed", "title": "Done"}]}}]'
  ),
  (
    'Team Project',
    'Collaborative workspace for team projects with multiple views',
    'team',
    true,
    'kanban',
    'light',
    'gradient',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '#4facfe',
    '[{"view_type": "kanban", "name": "Sprint Board", "config": {"columns": [{"id": "backlog", "title": "Backlog"}, {"id": "in-progress", "title": "In Progress"}, {"id": "review", "title": "Review"}, {"id": "completed", "title": "Done"}]}}, {"view_type": "timeline", "name": "Project Timeline", "config": {"startField": "start_date", "endField": "due_date"}}]'
  )
ON CONFLICT DO NOTHING;

-- Create default workspace for existing users
INSERT INTO workspaces (user_id, name, description, is_default)
SELECT
  id,
  'My Workspace',
  'Your default workspace',
  true
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces WHERE workspaces.user_id = users.id
);

COMMENT ON TABLE workspaces IS 'User workspaces with customizable layouts and themes';
COMMENT ON TABLE board_configs IS 'Configuration for different board views within workspaces';
COMMENT ON TABLE workspace_templates IS 'Predefined and AI-generated workspace templates';
