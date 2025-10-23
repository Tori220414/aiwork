const { supabase } = require('../config/supabase');
const { sendTaskAssignmentEmail } = require('./emailService');

/**
 * Notification Service
 * Handles creating in-app notifications and sending email notifications
 */

/**
 * Create a notification in the database
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(notificationData) {
  const {
    user_id,
    type,
    title,
    message,
    task_id,
    workspace_id,
    related_user_id,
    metadata = {}
  } = notificationData;

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([{
      user_id,
      type,
      title,
      message,
      task_id,
      workspace_id,
      related_user_id,
      metadata,
      is_read: false,
      email_sent: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return notification;
}

/**
 * Get user notification preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User notification preferences
 */
async function getUserNotificationPreferences(userId) {
  const { data: preferences, error } = await supabase
    .from('user_notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user notification preferences:', error);
    // Return default preferences if not found
    return {
      email_task_assigned: true,
      email_task_updated: true,
      email_task_completed: false,
      email_task_comment: true,
      inapp_task_assigned: true,
      inapp_task_updated: true,
      inapp_task_completed: true,
      inapp_task_comment: true,
      email_digest_frequency: 'instant'
    };
  }

  return preferences;
}

/**
 * Send task assignment notification
 * @param {Object} options - Notification options
 * @param {string} options.assignedToUserId - User ID of person being assigned
 * @param {string} options.assignedByUserId - User ID of person who assigned
 * @param {Object} options.task - Task object
 * @param {Object} options.workspace - Workspace object
 */
async function sendTaskAssignmentNotification(options) {
  const { assignedToUserId, assignedByUserId, task, workspace } = options;

  try {
    // Get user who was assigned the task
    const { data: assignedUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', assignedToUserId)
      .single();

    if (userError || !assignedUser) {
      console.error('Error fetching assigned user:', userError);
      return;
    }

    // Get user who assigned the task
    const { data: assignedByUser, error: assignedByError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', assignedByUserId)
      .single();

    if (assignedByError || !assignedByUser) {
      console.error('Error fetching assigner user:', assignedByError);
      return;
    }

    // Get user notification preferences
    const preferences = await getUserNotificationPreferences(assignedToUserId);

    // Create in-app notification if user has it enabled
    if (preferences.inapp_task_assigned) {
      const notification = await createNotification({
        user_id: assignedToUserId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${assignedByUser.name || assignedByUser.email} assigned you "${task.title}"`,
        task_id: task.id,
        workspace_id: workspace.id,
        related_user_id: assignedByUserId,
        metadata: {
          task_title: task.title,
          workspace_name: workspace.name,
          assigned_by_name: assignedByUser.name || assignedByUser.email
        }
      });

      console.log('In-app notification created:', notification.id);
    }

    // Send email notification if user has it enabled
    if (preferences.email_task_assigned && preferences.email_digest_frequency === 'instant') {
      const emailResult = await sendTaskAssignmentEmail({
        to: assignedUser.email,
        assignedByName: assignedByUser.name || assignedByUser.email,
        taskTitle: task.title,
        taskDescription: task.description,
        workspaceName: workspace.name,
        dueDate: task.due_date,
        priority: task.priority,
        taskUrl: `${process.env.FRONTEND_URL || 'https://aiwork-sooty.vercel.app'}/workspaces/${workspace.id}`
      });

      if (emailResult.sent) {
        // Update notification to mark email as sent
        if (preferences.inapp_task_assigned) {
          await supabase
            .from('notifications')
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString()
            })
            .eq('user_id', assignedToUserId)
            .eq('task_id', task.id)
            .eq('type', 'task_assigned')
            .order('created_at', { ascending: false })
            .limit(1);
        }

        console.log('Task assignment email sent to:', assignedUser.email);
      } else {
        console.error('Failed to send task assignment email:', emailResult.error);

        // Log email error in notification
        if (preferences.inapp_task_assigned) {
          await supabase
            .from('notifications')
            .update({
              email_error: emailResult.error
            })
            .eq('user_id', assignedToUserId)
            .eq('task_id', task.id)
            .eq('type', 'task_assigned')
            .order('created_at', { ascending: false })
            .limit(1);
        }
      }
    }

  } catch (error) {
    console.error('Error sending task assignment notification:', error);
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 */
async function markNotificationAsRead(notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }

  return data;
}

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 */
async function getUserNotifications(userId, options = {}) {
  const {
    limit = 50,
    offset = 0,
    unreadOnly = false
  } = options;

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data;
}

/**
 * Get unread notification count
 * @param {string} userId - User ID
 */
async function getUnreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }

  return count;
}

module.exports = {
  createNotification,
  getUserNotificationPreferences,
  sendTaskAssignmentNotification,
  markNotificationAsRead,
  getUserNotifications,
  getUnreadNotificationCount
};
