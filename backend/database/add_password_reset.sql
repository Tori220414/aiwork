-- Add password reset columns to users table
-- Run this migration in Supabase SQL Editor

-- Add reset_token column (stores hashed token)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);

-- Add reset_token_expires column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('reset_token', 'reset_token_expires');
