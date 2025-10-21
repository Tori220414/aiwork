-- Add task assignment support for team workspaces

-- Add assigned_to field to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for assigned_to lookups
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Add index for workspace_id lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);

-- Add composite index for workspace + assigned user queries
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_assigned ON tasks(workspace_id, assigned_to);

COMMENT ON COLUMN tasks.assigned_to IS 'User the task is assigned to (for team workspaces)';
