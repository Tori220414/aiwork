const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/supabase');
const geminiService = require('../services/geminiService');
const microsoftGraphService = require('../services/microsoftGraphService');
const googleCalendarService = require('../services/googleCalendarService');
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
 * Helper to ensure valid Google access token
 */
async function ensureValidGoogleToken(user) {
  const now = new Date();
  const expiresAt = user.google_token_expires_at ? new Date(user.google_token_expires_at) : null;

  if (!expiresAt || expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
    if (!user.google_refresh_token) {
      throw new Error('Google Calendar not connected. Please connect your calendar first.');
    }

    const tokens = await googleCalendarService.refreshAccessToken(user.google_refresh_token);
    const supabase = getSupabase();
    const newExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    await supabase
      .from('users')
      .update({
        google_access_token: tokens.accessToken,
        google_refresh_token: tokens.refreshToken,
        google_token_expires_at: newExpiresAt.toISOString()
      })
      .eq('id', user.id);

    return tokens.accessToken;
  }

  return user.google_access_token;
}

/**
 * Generate daily plan and sync to calendars
 */
router.post('/daily/generate-and-sync', async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, syncToOutlook = false, syncToGoogle = false, timezoneOffset = 0 } = req.body;

    // Get user's tasks and preferences
    const supabase = getSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('*, outlook_connected, outlook_access_token, outlook_refresh_token, outlook_token_expires_at, google_connected, google_access_token, google_refresh_token, google_token_expires_at')
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

    // Parse the date in the user's timezone for both calendars
    const [year, month, day] = (date || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const planDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Check if a plan already exists for this date
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id, plan_data')
      .eq('user_id', userId)
      .eq('plan_type', 'daily')
      .eq('plan_date', planDate)
      .single();

    // If regenerating, delete old calendar events first
    if (existingPlan) {
      console.log('🔄 Found existing plan, will delete old calendar events');
      const { data: oldEvents } = await supabase
        .from('plan_events')
        .select('*')
        .eq('plan_id', existingPlan.id);

      if (oldEvents && oldEvents.length > 0) {
        // Delete old Outlook events
        if (user.outlook_connected && syncToOutlook) {
          const outlookAccessToken = await ensureValidOutlookToken(user);
          for (const event of oldEvents) {
            if (event.outlook_event_id) {
              try {
                await microsoftGraphService.deleteEvent(outlookAccessToken, event.outlook_event_id);
                console.log('🗑️  Deleted old Outlook event:', event.outlook_event_id);
              } catch (err) {
                console.error('Failed to delete Outlook event:', err.message);
              }
            }
          }
        }

        // Delete old Google Calendar events
        if (user.google_connected && syncToGoogle) {
          const googleAccessToken = await ensureValidGoogleToken(user);
          for (const event of oldEvents) {
            if (event.google_event_id) {
              try {
                await googleCalendarService.deleteEvent(googleAccessToken, event.google_event_id);
                console.log('🗑️  Deleted old Google Calendar event:', event.google_event_id);
              } catch (err) {
                console.error('Failed to delete Google Calendar event:', err.message);
              }
            }
          }
        }

        // Delete old event records
        await supabase
          .from('plan_events')
          .delete()
          .eq('plan_id', existingPlan.id);
      }
    }

    // Sync to calendars if enabled and connected
    let syncedEventsOutlook = [];
    let syncedEventsGoogle = [];
    let syncErrors = [];

    // Sync to Outlook if enabled
    if (syncToOutlook && user.outlook_connected) {
      try {
        console.log('🔵 Syncing daily plan to Outlook for user:', user.outlook_email);
        console.log('🔵 Timezone offset:', timezoneOffset, 'minutes');
        const accessToken = await ensureValidOutlookToken(user);
        console.log('🔵 Plan has', plan.timeBlocks.length, 'time blocks for date:', date);

        // Create calendar events for each time block
        for (const block of plan.timeBlocks) {
          if (block.type === 'break' || !block.taskTitle) continue;
          console.log('🔵 Creating Outlook event:', block.taskTitle, block.startTime, '-', block.endTime);

          const [startHour, startMin] = block.startTime.split(':');
          const [endHour, endMin] = block.endTime.split(':');

          // Create Date in UTC, then adjust for user's timezone
          // timezoneOffset is negative for timezones ahead of UTC (e.g., -600 for UTC+10)
          const startTime = new Date(Date.UTC(year, month - 1, day, parseInt(startHour), parseInt(startMin), 0));
          startTime.setMinutes(startTime.getMinutes() + timezoneOffset);

          const endTime = new Date(Date.UTC(year, month - 1, day, parseInt(endHour), parseInt(endMin), 0));
          endTime.setMinutes(endTime.getMinutes() + timezoneOffset);

          console.log('🔵 Event times (UTC):', startTime.toISOString(), '-', endTime.toISOString());

          const event = {
            title: `[Plan] ${block.taskTitle}`,
            description: block.notes || 'Part of your daily plan',
            startTime,
            endTime
          };

          const createdEvent = await microsoftGraphService.createEvent(accessToken, event);
          console.log('✅ Outlook event created:', createdEvent.id);
          syncedEventsOutlook.push({
            taskTitle: block.taskTitle,
            startTime: block.startTime,
            endTime: block.endTime,
            outlookEventId: createdEvent.id
          });
        }
        console.log('✅ Successfully synced', syncedEventsOutlook.length, 'events to Outlook');
      } catch (syncError) {
        console.error('❌ Outlook sync error:', syncError.message);
        syncErrors.push(`Outlook: ${syncError.message}`);
      }
    }

    // Sync to Google Calendar if enabled
    if (syncToGoogle && user.google_connected) {
      try {
        console.log('🟢 Syncing daily plan to Google Calendar for user:', user.google_email);
        const accessToken = await ensureValidGoogleToken(user);
        console.log('🟢 Plan has', plan.timeBlocks.length, 'time blocks for date:', date);

        // Create calendar events for each time block
        for (const block of plan.timeBlocks) {
          if (block.type === 'break' || !block.taskTitle) continue;
          console.log('🟢 Creating Google Calendar event:', block.taskTitle, block.startTime, '-', block.endTime);

          const [startHour, startMin] = block.startTime.split(':');
          const [endHour, endMin] = block.endTime.split(':');

          // Create Date in UTC, then adjust for user's timezone
          const startTime = new Date(Date.UTC(year, month - 1, day, parseInt(startHour), parseInt(startMin), 0));
          startTime.setMinutes(startTime.getMinutes() + timezoneOffset);

          const endTime = new Date(Date.UTC(year, month - 1, day, parseInt(endHour), parseInt(endMin), 0));
          endTime.setMinutes(endTime.getMinutes() + timezoneOffset);

          console.log('🟢 Event times (UTC):', startTime.toISOString(), '-', endTime.toISOString());

          const event = {
            title: `[Plan] ${block.taskTitle}`,
            description: block.notes || 'Part of your daily plan',
            startTime,
            endTime
          };

          const createdEvent = await googleCalendarService.createEvent(accessToken, event);
          console.log('✅ Google Calendar event created:', createdEvent.id);
          syncedEventsGoogle.push({
            taskTitle: block.taskTitle,
            startTime: block.startTime,
            endTime: block.endTime,
            googleEventId: createdEvent.id
          });
        }
        console.log('✅ Successfully synced', syncedEventsGoogle.length, 'events to Google Calendar');
      } catch (syncError) {
        console.error('❌ Google Calendar sync error:', syncError.message);
        syncErrors.push(`Google: ${syncError.message}`);
      }
    }

    const totalSynced = syncedEventsOutlook.length + syncedEventsGoogle.length;

    // Save or update the plan in database
    let savedPlanId;
    if (existingPlan) {
      // Update existing plan
      await supabase
        .from('plans')
        .update({
          plan_data: plan,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlan.id);
      savedPlanId = existingPlan.id;
      console.log('✅ Updated existing plan:', savedPlanId);
    } else {
      // Create new plan
      const { data: newPlan, error: planError } = await supabase
        .from('plans')
        .insert({
          user_id: userId,
          plan_type: 'daily',
          plan_date: planDate,
          plan_data: plan
        })
        .select()
        .single();

      if (planError) {
        console.error('Failed to save plan:', planError);
      } else {
        savedPlanId = newPlan.id;
        console.log('✅ Saved new plan:', savedPlanId);
      }
    }

    // Save plan events to track calendar syncs
    if (savedPlanId && totalSynced > 0) {
      const eventRecords = [];

      for (const event of syncedEventsOutlook) {
        const block = plan.timeBlocks.find(b => b.taskTitle === event.taskTitle);
        eventRecords.push({
          plan_id: savedPlanId,
          task_title: event.taskTitle,
          start_time: new Date(`${planDate}T${event.startTime}:00`).toISOString(),
          end_time: new Date(`${planDate}T${event.endTime}:00`).toISOString(),
          event_type: block?.type || 'work',
          notes: block?.notes,
          outlook_event_id: event.outlookEventId,
          synced_to_outlook: true,
          synced_to_google: false
        });
      }

      for (const event of syncedEventsGoogle) {
        const block = plan.timeBlocks.find(b => b.taskTitle === event.taskTitle);
        const existingRecord = eventRecords.find(r => r.task_title === event.taskTitle);

        if (existingRecord) {
          // Event synced to both calendars
          existingRecord.google_event_id = event.googleEventId;
          existingRecord.synced_to_google = true;
        } else {
          // Event only synced to Google
          eventRecords.push({
            plan_id: savedPlanId,
            task_title: event.taskTitle,
            start_time: new Date(`${planDate}T${event.startTime}:00`).toISOString(),
            end_time: new Date(`${planDate}T${event.endTime}:00`).toISOString(),
            event_type: block?.type || 'work',
            notes: block?.notes,
            google_event_id: event.googleEventId,
            synced_to_outlook: false,
            synced_to_google: true
          });
        }
      }

      if (eventRecords.length > 0) {
        const { error: eventsError } = await supabase
          .from('plan_events')
          .insert(eventRecords);

        if (eventsError) {
          console.error('Failed to save plan events:', eventsError);
        } else {
          console.log('✅ Saved', eventRecords.length, 'plan event records');
        }
      }
    }

    console.log('📊 Daily plan response:', {
      syncedToOutlook: syncedEventsOutlook.length > 0,
      syncedToGoogle: syncedEventsGoogle.length > 0,
      totalSynced: totalSynced
    });

    res.json({
      success: true,
      plan,
      syncedToOutlook: syncedEventsOutlook.length > 0,
      syncedToGoogle: syncedEventsGoogle.length > 0,
      syncedEvents: [...syncedEventsOutlook, ...syncedEventsGoogle],
      syncErrors: syncErrors.length > 0 ? syncErrors.join(', ') : null,
      message: totalSynced > 0
        ? `Daily plan generated and ${totalSynced} events synced to calendar!`
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
    const { weekStart, syncToOutlook = true, timezoneOffset = 0 } = req.body;

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
        console.log('🔵 Timezone offset:', timezoneOffset, 'minutes');
        const accessToken = await ensureValidOutlookToken(user);
        console.log('🔵 Weekly plan has', plan.days.length, 'days');

        // Create calendar events for each day's time blocks
        for (const day of plan.days) {
          const [year, month, dayNum] = day.date.split('-').map(Number);
          console.log('🔵 Processing day:', day.dayName, day.date);

          for (const block of day.plan.timeBlocks) {
            if (block.type === 'break' || !block.taskTitle) continue;

            const [startHour, startMin] = block.startTime.split(':');
            const [endHour, endMin] = block.endTime.split(':');

            // Create Date in UTC, then adjust for user's timezone
            const startTime = new Date(Date.UTC(year, month - 1, dayNum, parseInt(startHour), parseInt(startMin), 0));
            startTime.setMinutes(startTime.getMinutes() + timezoneOffset);

            const endTime = new Date(Date.UTC(year, month - 1, dayNum, parseInt(endHour), parseInt(endMin), 0));
            endTime.setMinutes(endTime.getMinutes() + timezoneOffset);

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
