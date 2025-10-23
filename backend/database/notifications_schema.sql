-- Notifications Schema for AI Work
-- Handles in-app notifications and email notifications for task assignments and updates

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(50) NOT NULL, -- 'task_assigned', 'task_updated', 'task_completed', 'task_comment', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Related entities
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- user who triggered the notification

  -- Notification state
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_error TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- additional flexible data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Email notification preferences
  email_task_assigned BOOLEAN DEFAULT true,
  email_task_updated BOOLEAN DEFAULT true,
  email_task_completed BOOLEAN DEFAULT false,
  email_task_comment BOOLEAN DEFAULT true,
  email_task_due_soon BOOLEAN DEFAULT true,

  -- In-app notification preferences
  inapp_task_assigned BOOLEAN DEFAULT true,
  inapp_task_updated BOOLEAN DEFAULT true,
  inapp_task_completed BOOLEAN DEFAULT true,
  inapp_task_comment BOOLEAN DEFAULT true,

  -- Notification frequency
  email_digest_frequency VARCHAR(50) DEFAULT 'instant', -- 'instant', 'daily', 'weekly', 'never'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Create default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_notification_preferences WHERE user_notification_preferences.user_id = users.id
);

COMMENT ON TABLE notifications IS 'In-app and email notifications for users';
COMMENT ON TABLE user_notification_preferences IS 'User preferences for notification delivery and frequency';
