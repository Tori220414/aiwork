-- Admin System Database Schema
-- This schema provides complete admin functionality including:
-- - Support ticket system
-- - Admin activity logging
-- - System settings management
-- - Admin user permissions

-- ============================================================================
-- SUPPORT TICKETS TABLE
-- ============================================================================
-- Manages support tickets submitted by users
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'feature-request', 'bug-report')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'waiting-user', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  admin_notes TEXT,
  responses JSONB DEFAULT '[]'::jsonb,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient ticket queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- ============================================================================
-- ADMIN ACTIVITY LOG TABLE
-- ============================================================================
-- Tracks all admin actions for audit purposes
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient activity log queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_resource ON admin_activity_log(resource_type, resource_id);

-- ============================================================================
-- SYSTEM SETTINGS TABLE
-- ============================================================================
-- Stores configurable system settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for settings queries
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- ============================================================================
-- ALTER USERS TABLE FOR ADMIN PERMISSIONS
-- ============================================================================
-- Add admin-related fields to existing users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '[]'::jsonb;

-- Index for admin user queries
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_users_superadmin ON users(is_superadmin) WHERE is_superadmin = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on support tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own tickets
CREATE POLICY support_tickets_user_select ON support_tickets
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_superadmin = true)
  ));

CREATE POLICY support_tickets_user_insert ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own open tickets, admins can update all
CREATE POLICY support_tickets_user_update ON support_tickets
  FOR UPDATE
  USING (
    (auth.uid() = user_id AND status NOT IN ('resolved', 'closed'))
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_superadmin = true)
    )
  );

-- Enable RLS on activity log (read-only for admins)
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_activity_log_admin_select ON admin_activity_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_superadmin = true)
  ));

-- Enable RLS on system settings (superadmin only)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY system_settings_superadmin ON system_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = true
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on support tickets
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

-- Update updated_at timestamp on system settings
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- ============================================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (key, value, category, description)
VALUES
  ('maintenance_mode', 'false', 'system', 'Enable/disable maintenance mode'),
  ('allow_registrations', 'true', 'system', 'Allow new user registrations'),
  ('max_free_trial_days', '30', 'billing', 'Number of days for free trial'),
  ('support_email', '"tori.willoughby@hotelbargo.com.au"', 'contact', 'Support email address'),
  ('max_tasks_per_user', '1000', 'limits', 'Maximum tasks per user'),
  ('max_workspaces_per_user', '50', 'limits', 'Maximum workspaces per user')
ON CONFLICT (key) DO NOTHING;

-- Verify tables created
SELECT 'Admin schema created successfully!' as status;
