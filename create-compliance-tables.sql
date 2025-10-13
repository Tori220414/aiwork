-- Create Compliance Templates tables
-- Run this in your Supabase SQL Editor

-- ============================================
-- COMPLIANCE TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT NOT NULL, -- 'hospitality', 'construction', 'healthcare', 'finance', 'retail', 'manufacturing', 'other'
  category TEXT, -- e.g., 'Safety', 'Health', 'Financial', 'Operational', 'Legal'
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of checklist items with structure: {id, text, required, notes, completed, completedAt, completedBy}
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SAVED CHECKLIST INSTANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  template_id UUID REFERENCES compliance_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  category TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'overdue'
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for compliance_templates
CREATE INDEX IF NOT EXISTS idx_compliance_templates_workspace_id ON compliance_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_industry ON compliance_templates(industry);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_category ON compliance_templates(category);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_created_by ON compliance_templates(created_by);

-- Create indexes for checklist_instances
CREATE INDEX IF NOT EXISTS idx_checklist_instances_workspace_id ON checklist_instances(workspace_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_template_id ON checklist_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_status ON checklist_instances(status);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_assigned_to ON checklist_instances(assigned_to);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_created_by ON checklist_instances(created_by);

-- Enable Row Level Security for compliance_templates
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for compliance_templates
CREATE POLICY "Users can view their workspace templates"
  ON compliance_templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates for their workspaces"
  ON compliance_templates FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace templates"
  ON compliance_templates FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace templates"
  ON compliance_templates FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Enable Row Level Security for checklist_instances
ALTER TABLE checklist_instances ENABLE ROW LEVEL SECURITY;

-- Create policies for checklist_instances
CREATE POLICY "Users can view their workspace checklist instances"
  ON checklist_instances FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create checklist instances for their workspaces"
  ON checklist_instances FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their workspace checklist instances"
  ON checklist_instances FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace checklist instances"
  ON checklist_instances FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Verify the tables were created
SELECT 'Compliance templates tables created successfully!' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name IN ('compliance_templates', 'checklist_instances')
);
