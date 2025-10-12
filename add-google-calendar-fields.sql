-- Add Google Calendar integration fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_last_synced_at TIMESTAMPTZ;

-- Add Google Calendar fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS synced_to_google BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id);
CREATE INDEX IF NOT EXISTS idx_users_google_connected ON users(google_connected);

-- Verify it worked
SELECT 'Google Calendar fields added successfully!' as status;
