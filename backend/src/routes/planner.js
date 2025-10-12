const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/supabase');
const geminiService = require('../services/geminiService');
const microsoftGraphService = require('../services/microsoftGraphService');
const { protect } = require('../middleware/auth-supabase');

// Apply authentication middleware
router.use(protect);

/**
 * Helper to ensure valid Outlook access token
 */
async function ensureValidOutlookToken(user) {
  const now = new Date();
  const expiresAt = user.outlook_token_expires_at ? new Date(user.outlook_token_expires_at) : null;

  if (!expiresAt || expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
    if (!user.outlook_refresh_token) {
      throw new Error('Outlook not connected. Please connect your calendar first.');
    }

    const tokens = await microsoftGraphService.refreshAccessToken(user.outlook_refresh_token);
    const supabase = getSupabase();
    const newExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    await supabase
      .from('users')
      .update({
        outlook_access_token: tokens.accessToken,
        outlook_refresh_token: tokens.refreshToken,
        outlook_token_expires_at: newExpiresAt.toISOString()
      })
      .eq('id', user.id);

    return tokens.accessToken;
  }

  return user.outlook_access_token;
}

/**
 * Generate daily plan and sync to Outlook
 */
router.post('/daily/generate-and-sync', async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, syncToOutlook = true } = req.body;

    // Get user's tasks and preferences
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('*, outlook_connected, outlook_access_token, outlook_refresh_token, outlook_token_expires_at')
      .eq('id', userId)
      .single();

    // Get pending tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({
        message: 'No pending tasks found. Create some tasks first!'
      });
    }

    // Generate daily plan with AI
    const plan = await geminiService.generateDailyPlan(tasks, user.preferences || {});

    if (!plan) {
      return res.status(500).json({ message: 'Failed to generate daily plan' });
    }

    // Sync to Outlook if enabled and connected
    let syncedEvents = [];
    if (syncToOutlook && user.outlook_connected) {
      try {
        console.log('🔵 Syncing daily plan to Outlook for user:', user.outlook_email);
        const accessToken = await ensureValidOutlookToken(user);
        const planDate = date ? new Date(date) : new Date();
        console.log('🔵 Plan has', plan.timeBlocks.length, 'time blocks for date:', planDate);

        // Create calendar events for each time block
        for (const block of plan.timeBlocks) {
          if (block.type === 'break' || !block.taskTitle) continue;
          console.log('🔵 Creating event:', block.taskTitle, block.startTime, '-', block.endTime);

          const [startHour, startMin] = block.startTime.split(':');
          const [endHour, endMin] = block.endTime.split(':');

          const startTime = new Date(planDate);
          startTime.setHours(parseInt(startHour), parseInt(startMin), 0);

          const endTime = new Date(planDate);
          endTime.setHours(parseInt(endHour), parseInt(endMin), 0);

          const event = {
            title: `[Plan] ${block.taskTitle}`,
            description: block.notes || 'Part of your daily plan',
            startTime,
            endTime
          };

          const createdEvent = await microsoftGraphService.createEvent(accessToken, event);
          console.log('✅ Event created:', createdEvent.id);
          syncedEvents.push({
            taskTitle: block.taskTitle,
            startTime: block.startTime,
            endTime: block.endTime,
            outlookEventId: createdEvent.id
          });
        }
        console.log('✅ Successfully synced', syncedEvents.length, 'events to Outlook');
      } catch (syncError) {
        console.error('❌ Outlook sync error:', syncError.message);
        console.error('Full error:', syncError);
        // Continue even if sync fails - return plan anyway
        return res.json({
          success: true,
          plan,
          syncedToOutlook: false,
          syncError: syncError.message,
          message: 'Plan generated but failed to sync to Outlook'
        });
      }
    }

    console.log('📊 Daily plan response:', {
      syncedToOutlook: syncedEvents.length > 0,
      eventCount: syncedEvents.length
    });

    res.json({
      success: true,
      plan,
      syncedToOutlook: syncedEvents.length > 0,
      syncedEvents,
      message: syncedEvents.length > 0
        ? `Daily plan generated and ${syncedEvents.length} events added to Outlook!`
        : 'Daily plan generated successfully!'
    });

  } catch (error) {
    console.error('Daily plan generation error:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate daily plan'
    });
  }
});

/**
 * Generate weekly plan and sync to Outlook
 */
router.post('/weekly/generate-and-sync', async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekStart, syncToOutlook = true } = req.body;

    // Get user's tasks and preferences
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('*, outlook_connected, outlook_access_token, outlook_refresh_token, outlook_token_expires_at')
      .eq('id', userId)
      .single();

    // Get pending tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({
        message: 'No pending tasks found. Create some tasks first!'
      });
    }

    // Generate weekly plan with AI
    const startDate = weekStart ? new Date(weekStart) : new Date();
    const plan = await geminiService.generateWeeklyPlan(tasks, user.preferences || {}, startDate);

    if (!plan) {
      return res.status(500).json({ message: 'Failed to generate weekly plan' });
    }

    // Sync to Outlook if enabled and connected
    let syncedEvents = [];
    if (syncToOutlook && user.outlook_connected) {
      try {
        console.log('🔵 Syncing weekly plan to Outlook for user:', user.outlook_email);
        const accessToken = await ensureValidOutlookToken(user);
        console.log('🔵 Weekly plan has', plan.days.length, 'days');

        // Create calendar events for each day's time blocks
        for (const day of plan.days) {
          const dayDate = new Date(day.date);
          console.log('🔵 Processing day:', day.dayName, dayDate);

          for (const block of day.plan.timeBlocks) {
            if (block.type === 'break' || !block.taskTitle) continue;

            const [startHour, startMin] = block.startTime.split(':');
            const [endHour, endMin] = block.endTime.split(':');

            const startTime = new Date(dayDate);
            startTime.setHours(parseInt(startHour), parseInt(startMin), 0);

            const endTime = new Date(dayDate);
            endTime.setHours(parseInt(endHour), parseInt(endMin), 0);

            const event = {
              title: `[${day.dayName}] ${block.taskTitle}`,
              description: block.notes || `Part of your weekly plan for ${day.dayName}`,
              startTime,
              endTime
            };

            const createdEvent = await microsoftGraphService.createEvent(accessToken, event);
            console.log('✅ Event created:', createdEvent.id, '/', block.taskTitle);
            syncedEvents.push({
              day: day.dayName,
              taskTitle: block.taskTitle,
              startTime: block.startTime,
              endTime: block.endTime,
              outlookEventId: createdEvent.id
            });
          }
        }
        console.log('✅ Successfully synced', syncedEvents.length, 'events to Outlook');
      } catch (syncError) {
        console.error('❌ Outlook sync error:', syncError.message);
        console.error('Full error:', syncError);
        // Continue even if sync fails - return plan anyway
        return res.json({
          success: true,
          plan,
          syncedToOutlook: false,
          syncError: syncError.message,
          message: 'Plan generated but failed to sync to Outlook'
        });
      }
    }

    console.log('📊 Weekly plan response:', {
      syncedToOutlook: syncedEvents.length > 0,
      eventCount: syncedEvents.length
    });

    res.json({
      success: true,
      plan,
      syncedToOutlook: syncedEvents.length > 0,
      syncedEvents,
      message: syncedEvents.length > 0
        ? `Weekly plan generated and ${syncedEvents.length} events added to Outlook!`
        : 'Weekly plan generated successfully!'
    });

  } catch (error) {
    console.error('Weekly plan generation error:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate weekly plan'
    });
  }
});

module.exports = router;
