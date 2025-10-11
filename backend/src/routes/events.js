const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-supabase');
const { getSupabase } = require('../config/supabase');
const geminiService = require('../services/geminiService');

// All routes are protected
router.use(protect);

// @route   GET /api/events
// @desc    Get all events for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { workspaceId, startDate, endDate } = req.query;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    }

    if (startDate && endDate) {
      query = query.gte('start_time', startDate).lte('start_time', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Get events error:', error);
      return res.status(500).json({ message: 'Error fetching events' });
    }

    res.json({ events: (events || []).map(e => ({ ...e, _id: e.id })) });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event with notes and action items
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get meeting notes
    const { data: notes } = await supabase
      .from('meeting_notes')
      .select('*')
      .eq('event_id', req.params.id)
      .order('created_at', { ascending: true });

    // Get action items
    const { data: actionItems } = await supabase
      .from('meeting_action_items')
      .select('*')
      .eq('event_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({
      ...event,
      _id: event.id,
      notes: (notes || []).map(n => ({ ...n, _id: n.id })),
      actionItems: (actionItems || []).map(a => ({ ...a, _id: a.id }))
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      all_day,
      location,
      attendees,
      meeting_link,
      workspace_id,
      color
    } = req.body;

    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        user_id: userId,
        workspace_id,
        title,
        description,
        event_type: event_type || 'event',
        start_time,
        end_time,
        all_day: all_day || false,
        location,
        attendees,
        meeting_link,
        color: color || '#3b82f6'
      }])
      .select()
      .single();

    if (error) {
      console.error('Create event error:', error);
      return res.status(500).json({ message: 'Error creating event' });
    }

    res.status(201).json({ ...event, _id: event.id });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const updateData = {};
    const allowedFields = [
      'title', 'description', 'event_type', 'start_time', 'end_time',
      'all_day', 'location', 'attendees', 'meeting_link', 'status', 'color'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const { data: event, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update event error:', error);
      return res.status(500).json({ message: 'Error updating event' });
    }

    res.json({ ...event, _id: event.id });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete event error:', error);
      return res.status(500).json({ message: 'Error deleting event' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/notes
// @desc    Add meeting note
// @access  Private
router.post('/:id/notes', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { content, notes_type } = req.body;

    const { data: note, error } = await supabase
      .from('meeting_notes')
      .insert([{
        event_id: req.params.id,
        user_id: userId,
        content,
        notes_type: notes_type || 'general'
      }])
      .select()
      .single();

    if (error) {
      console.error('Create note error:', error);
      return res.status(500).json({ message: 'Error creating note' });
    }

    res.status(201).json({ ...note, _id: note.id });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/action-items
// @desc    Add action item
// @access  Private
router.post('/:id/action-items', async (req, res) => {
  try {
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { title, description, assigned_to, due_date, priority, meeting_note_id } = req.body;

    const { data: actionItem, error } = await supabase
      .from('meeting_action_items')
      .insert([{
        event_id: req.params.id,
        meeting_note_id,
        title,
        description,
        assigned_to,
        due_date,
        priority: priority || 'medium'
      }])
      .select()
      .single();

    if (error) {
      console.error('Create action item error:', error);
      return res.status(500).json({ message: 'Error creating action item' });
    }

    res.status(201).json({ ...actionItem, _id: actionItem.id });
  } catch (error) {
    console.error('Create action item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events/:id/generate-prep
// @desc    Generate AI meeting prep
// @access  Private
router.post('/:id/generate-prep', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Generate meeting prep using AI
    const prep = await geminiService.generateMeetingPrep({
      title: event.title,
      attendees: event.attendees ? event.attendees.join(', ') : '',
      date: event.start_time,
      duration: event.end_time ?
        Math.round((new Date(event.end_time) - new Date(event.start_time)) / 60000) + ' minutes' :
        '30 minutes',
      context: event.description || ''
    });

    if (!prep) {
      return res.status(500).json({ message: 'Failed to generate meeting prep' });
    }

    // Save as meeting note
    const { data: note, error } = await supabase
      .from('meeting_notes')
      .insert([{
        event_id: req.params.id,
        user_id: userId,
        content: JSON.stringify(prep),
        notes_type: 'agenda',
        ai_generated: true,
        ai_summary: 'AI-generated meeting preparation'
      }])
      .select()
      .single();

    if (error) {
      console.error('Save prep note error:', error);
    }

    res.json({ prep, note: note ? { ...note, _id: note.id } : null });
  } catch (error) {
    console.error('Generate prep error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
