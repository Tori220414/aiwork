-- Create Compliance Workspace Template
-- Run this in your Supabase SQL Editor after creating the compliance tables

INSERT INTO workspace_templates (
  name,
  description,
  category,
  background_type,
  background_value,
  primary_color,
  secondary_color,
  default_view,
  is_ai_generated
) VALUES (
  'Compliance & Checklists',
  'AI-powered compliance checklist management. Create industry-standard checklists for hospitality, construction, healthcare, finance, and more using AI.',
  'compliance',
  'gradient',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  '#667eea',
  '#764ba2',
  'templates',
  false
);

-- Verify the template was created
SELECT * FROM workspace_templates WHERE category = 'compliance';
