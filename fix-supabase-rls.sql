-- Fix Row Level Security policies for AI Task Master
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily or create proper policies

-- For users table - allow public registration
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public user registration" ON users;
CREATE POLICY "Allow public user registration"
ON users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text);

-- For workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own workspaces" ON workspaces;
CREATE POLICY "Users can read own workspaces"
ON workspaces FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create own workspaces" ON workspaces;
CREATE POLICY "Users can create own workspaces"
ON workspaces FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own workspaces" ON workspaces;
CREATE POLICY "Users can update own workspaces"
ON workspaces FOR UPDATE
TO authenticated
USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own workspaces" ON workspaces;
CREATE POLICY "Users can delete own workspaces"
ON workspaces FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- For tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own tasks" ON tasks;
CREATE POLICY "Users can read own tasks"
ON tasks FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
CREATE POLICY "Users can create own tasks"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
TO authenticated
USING (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks"
ON tasks FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- For events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read workspace events" ON events;
CREATE POLICY "Users can read workspace events"
ON events FOR SELECT
TO authenticated
USING (
  workspace_id IN (
    SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can create workspace events" ON events;
CREATE POLICY "Users can create workspace events"
ON events FOR INSERT
TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can update workspace events" ON events;
CREATE POLICY "Users can update workspace events"
ON events FOR UPDATE
TO authenticated
USING (
  workspace_id IN (
    SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
  )
);

DROP POLICY IF EXISTS "Users can delete workspace events" ON events;
CREATE POLICY "Users can delete workspace events"
ON events FOR DELETE
TO authenticated
USING (
  workspace_id IN (
    SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
  )
);

-- For action_items table
-- Create the action_items table first if it doesn't exist
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
-- First create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS action_items (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    meeting_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Then enable RLS
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read event action items" ON action_items;
CREATE POLICY "Users can read event action items"
ON action_items FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "Users can create event action items" ON action_items;
CREATE POLICY "Users can create event action items"
ON action_items FOR INSERT
TO authenticated
WITH CHECK (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "Users can update event action items" ON action_items;
CREATE POLICY "Users can update event action items"
ON action_items FOR UPDATE
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "Users can delete event action items" ON action_items;
CREATE POLICY "Users can delete event action items"
ON action_items FOR DELETE
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
);

-- For meeting_notes table
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read event notes" ON meeting_notes;
CREATE POLICY "Users can read event notes"
ON meeting_notes FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "Users can create event notes" ON meeting_notes;
CREATE POLICY "Users can create event notes"
ON meeting_notes FOR INSERT
TO authenticated
WITH CHECK (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "Users can update event notes" ON meeting_notes;
CREATE POLICY "Users can update event notes"
ON meeting_notes FOR UPDATE
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "Users can delete event notes" ON meeting_notes;
CREATE POLICY "Users can delete event notes"
ON meeting_notes FOR DELETE
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events WHERE workspace_id IN (
      SELECT id FROM workspaces WHERE user_id::text = auth.uid()::text
    )
  )
)