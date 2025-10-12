-- Add Outlook Calendar Integration fields to users table

-- Add outlook calendar integration columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS outlook_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS outlook_email TEXT,
ADD COLUMN IF NOT EXISTS outlook_access_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS outlook_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS outlook_last_synced_at TIMESTAMPTZ;

-- Add outlook event sync fields to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS outlook_event_id TEXT,
ADD COLUMN IF NOT EXISTS synced_to_outlook BOOLEAN DEFAULT false;

-- Create index on outlook_event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_outlook_event_id ON tasks(outlook_event_id);

-- Create index on outlook_connected for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_outlook_connected ON users(outlook_connected);

COMMENT ON COLUMN users.outlook_connected IS 'Whether the user has connected their Outlook calendar';
COMMENT ON COLUMN users.outlook_email IS 'Email address of the connected Outlook account';
COMMENT ON COLUMN users.outlook_access_token IS 'Microsoft Graph API access token (encrypted)';
COMMENT ON COLUMN users.outlook_refresh_token IS 'Microsoft Graph API refresh token (encrypted)';
COMMENT ON COLUMN users.outlook_token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN users.outlook_last_synced_at IS 'Last time calendar was synced';

COMMENT ON COLUMN tasks.outlook_event_id IS 'ID of the corresponding Outlook calendar event';
COMMENT ON COLUMN tasks.synced_to_outlook IS 'Whether this task has been synced to Outlook calendar';
