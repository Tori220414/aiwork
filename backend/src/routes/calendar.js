const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/supabase');
const microsoftGraphService = require('../services/microsoftGraphService');
const { protect } = require('../middleware/auth-supabase');

// Apply authentication middleware to all calendar routes
router.use(protect);

/**
 * Helper function to get user with calendar tokens
 */
async function getUserWithTokens(userId) {
  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error('User not found');
  return user;
}

/**
 * Helper function to ensure valid access token
 */
async function ensureValidAccessToken(user) {
  // Check if token is expired or will expire in next 5 minutes
  const now = new Date();
  const expiresAt = user.outlook_token_expires_at ? new Date(user.outlook_token_expires_at) : null;

  if (!expiresAt || expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
    // Token expired or will expire soon, refresh it
    if (!user.outlook_refresh_token) {
      throw new Error('Refresh token not available. Please reconnect your Outlook account.');
    }

    const tokens = await microsoftGraphService.refreshAccessToken(user.outlook_refresh_token);

    // Update tokens in database
    const supabase = getSupabase();
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    await supabase
      .from('users')
      .update({
        outlook_access_token: tokens.accessToken,
        outlook_refresh_token: tokens.refreshToken,
        outlook_token_expires_at: expiresAt.toISOString()
      })
      .eq('id', user.id);

    return tokens.accessToken;
  }

  return user.outlook_access_token;
}

/**
 * Connect Outlook calendar - Exchange code for tokens
 */
router.post('/outlook/connect', async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    // Log environment config (without exposing secrets)
    console.log('Outlook Config:', {
      clientId: process.env.OUTLOOK_CLIENT_ID ? 'SET' : 'MISSING',
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET ? 'SET' : 'MISSING',
      redirectUri: process.env.OUTLOOK_REDIRECT_URI
    });

    // Exchange code for tokens
    const tokens = await microsoftGraphService.getAccessToken(code);

    // Get user profile from Microsoft
    const profile = await microsoftGraphService.getUserProfile(tokens.accessToken);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // Update user with calendar integration data
    const supabase = getSupabase();
    const { error } = await supabase
      .from('users')
      .update({
        outlook_connected: true,
        outlook_email: profile.email,
        outlook_access_token: tokens.accessToken,
        outlook_refresh_token: tokens.refreshToken,
        outlook_token_expires_at: expiresAt.toISOString(),
        outlook_last_synced_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Failed to save calendar connection' });
    }

    res.json({
      success: true,
      message: 'Outlook calendar connected successfully',
      email: profile.email
    });
  } catch (error) {
    console.error('Error connecting Outlook:', error);
    res.status(500).json({
      message: error.message || 'Failed to connect Outlook calendar'
    });
  }
});

/**
 * Get Outlook connection status
 */
router.get('/outlook/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserWithTokens(userId);

    res.json({
      connected: user.outlook_connected || false,
      email: user.outlook_email || null,
      lastSynced: user.outlook_last_synced_at || null
    });
  } catch (error) {
    console.error('Error getting Outlook status:', error);
    res.status(500).json({
      message: 'Failed to get Outlook status',
      connected: false
    });
  }
});

/**
 * Disconnect Outlook calendar
 */
router.post('/outlook/disconnect', async (req, res) => {
  try {
    const userId = req.user.id;

    const supabase = getSupabase();
    const { error } = await supabase
      .from('users')
      .update({
        outlook_connected: false,
        outlook_email: null,
        outlook_access_token: null,
        outlook_refresh_token: null,
        outlook_token_expires_at: null,
        outlook_last_synced_at: null
      })
      .eq('id', userId);

    if (error) {
      console.error('Error disconnecting Outlook:', error);
      return res.status(500).json({ message: 'Failed to disconnect Outlook' });
    }

    res.json({
      success: true,
      message: 'Outlook calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting Outlook:', error);
    res.status(500).json({
      message: 'Failed to disconnect Outlook calendar'
    });
  }
});

/**
 * Sync task to Outlook calendar
 */
router.post('/outlook/sync-task/:taskId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;

    const user = await getUserWithTokens(userId);

    if (!user.outlook_connected) {
      return res.status(400).json({ message: 'Outlook calendar not connected' });
    }

    // Get task details
    const supabase = getSupabase();
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Ensure valid access token
    const accessToken = await ensureValidAccessToken(user);

    // Prepare event data
    const startTime = task.due_date ? new Date(task.due_date) : new Date();
    const endTime = new Date(startTime.getTime() + (task.estimated_time || 30) * 60 * 1000);

    const event = {
      title: task.title,
      description: task.description || '',
      startTime,
      endTime
    };

    // Create event in Outlook
    const outlookEvent = await microsoftGraphService.createEvent(accessToken, event);

    // Update task with Outlook event ID
    await supabase
      .from('tasks')
      .update({
        outlook_event_id: outlookEvent.id,
        synced_to_outlook: true
      })
      .eq('id', taskId);

    res.json({
      success: true,
      eventId: outlookEvent.id,
      message: 'Task synced to Outlook calendar'
    });
  } catch (error) {
    console.error('Error syncing task to Outlook:', error);
    res.status(500).json({
      message: error.message || 'Failed to sync task to Outlook'
    });
  }
});

/**
 * Create event in Outlook calendar
 */
router.post('/outlook/events', async (req, res) => {
  try {
    const userId = req.user.id;
    const eventData = req.body;

    const user = await getUserWithTokens(userId);

    if (!user.outlook_connected) {
      return res.status(400).json({ message: 'Outlook calendar not connected' });
    }

    // Ensure valid access token
    const accessToken = await ensureValidAccessToken(user);

    // Create event
    const event = await microsoftGraphService.createEvent(accessToken, eventData);

    res.json({
      success: true,
      eventId: event.id,
      message: 'Event created in Outlook calendar'
    });
  } catch (error) {
    console.error('Error creating Outlook event:', error);
    res.status(500).json({
      message: error.message || 'Failed to create Outlook event'
    });
  }
});

/**
 * Get Outlook calendar events
 */
router.get('/outlook/events', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const user = await getUserWithTokens(userId);

    if (!user.outlook_connected) {
      return res.status(400).json({ message: 'Outlook calendar not connected' });
    }

    // Ensure valid access token
    const accessToken = await ensureValidAccessToken(user);

    // Default to next 30 days
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const events = await microsoftGraphService.getEvents(accessToken, start, end);

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error getting Outlook events:', error);
    res.status(500).json({
      message: error.message || 'Failed to get Outlook events'
    });
  }
});

/**
 * Import Outlook events as tasks
 */
router.post('/outlook/import', async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventIds } = req.body;

    if (!eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ message: 'Event IDs array is required' });
    }

    const user = await getUserWithTokens(userId);

    if (!user.outlook_connected) {
      return res.status(400).json({ message: 'Outlook calendar not connected' });
    }

    // Ensure valid access token
    const accessToken = await ensureValidAccessToken(user);

    // Get events from Outlook
    const start = new Date();
    const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    const events = await microsoftGraphService.getEvents(accessToken, start, end);

    // Filter only requested events
    const eventsToImport = events.filter(e => eventIds.includes(e.id));

    let tasksCreated = 0;

    // Create tasks from events
    const supabase = getSupabase();
    for (const event of eventsToImport) {
      const estimatedTime = Math.round(
        (new Date(event.endTime) - new Date(event.startTime)) / (60 * 1000)
      );

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: event.title,
          description: event.description,
          due_date: event.startTime,
          estimated_time: estimatedTime,
          category: 'meeting',
          priority: 'medium',
          status: 'pending',
          outlook_event_id: event.id,
          synced_to_outlook: true
        });

      if (!error) {
        tasksCreated++;
      }
    }

    res.json({
      success: true,
      tasksCreated,
      message: `Imported ${tasksCreated} events as tasks`
    });
  } catch (error) {
    console.error('Error importing Outlook events:', error);
    res.status(500).json({
      message: error.message || 'Failed to import Outlook events'
    });
  }
});

module.exports = router;
