-- Events and Meetings Schema for AI Task Master

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Event details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'event', -- event, meeting, deadline, reminder

  -- Time and location
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  location VARCHAR(500),

  -- Meeting specific
  attendees TEXT[], -- Array of attendee names/emails
  meeting_link VARCHAR(500), -- Zoom, Teams, Meet link

  -- Status and metadata
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in-progress, completed, cancelled
  color VARCHAR(7) DEFAULT '#3b82f6',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting notes table
CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Note content
  content TEXT,
  notes_type VARCHAR(50) DEFAULT 'general', -- general, agenda, action-items, decisions

  -- AI generated content
  ai_generated BOOLEAN DEFAULT false,
  ai_summary TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting action items table
CREATE TABLE IF NOT EXISTS meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_note_id UUID NOT NULL REFERENCES meeting_notes(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Action item details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to VARCHAR(255),
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in-progress, completed
  priority VARCHAR(50) DEFAULT 'medium',

  -- Link to task if converted
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_workspace_id ON events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_event_id ON meeting_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_event_id ON meeting_action_items(event_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_status ON meeting_action_items(status);

-- Triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

CREATE TRIGGER update_meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

CREATE TRIGGER update_meeting_action_items_updated_at
  BEFORE UPDATE ON meeting_action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

COMMENT ON TABLE events IS 'Events, meetings, and calendar items';
COMMENT ON TABLE meeting_notes IS 'Notes and minutes for meetings';
COMMENT ON TABLE meeting_action_items IS 'Action items and follow-ups from meetings';
