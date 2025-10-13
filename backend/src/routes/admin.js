const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, logAdminActivity } = require('../middleware/adminAuth');
const stripe = require('../config/stripe');

// Apply authentication to all admin routes
router.use(authenticateToken);

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total tasks count
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Get open support tickets count
    const { count: openTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in-progress']);

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newUsersThisMonth } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Get revenue this month (from active subscriptions)
    const { data: monthlyRevenue } = await supabase
      .from('subscriptions')
      .select('amount')
      .eq('status', 'active')
      .gte('created_at', startOfMonth.toISOString());

    const revenueThisMonth = monthlyRevenue?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0;

    await logAdminActivity(req.user.id, 'view_stats', 'dashboard', null, {}, req);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        totalTasks: totalTasks || 0,
        openTickets: openTickets || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        revenueThisMonth: revenueThisMonth
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics'
    });
  }
});

/**
 * GET /api/admin/users
 * Get paginated list of users with filters
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    let query = supabase
      .from('users')
      .select('id, name, email, created_at, is_active, is_admin, is_superadmin, admin_permissions', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (status === 'admin') {
      query = query.eq('is_admin', true);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) throw error;

    await logAdminActivity(req.user.id, 'list_users', 'users', null, { page, limit, search, status }, req);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

/**
 * PUT /api/admin/users/:userId/status
 * Activate or deactivate a user (Superadmin only)
 */
router.put('/users/:userId/status', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_active must be a boolean'
      });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('users')
      .update({ is_active })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      is_active ? 'activate_user' : 'deactivate_user',
      'user',
      userId,
      { is_active },
      req
    );

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      data
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

/**
 * PUT /api/admin/users/:userId/admin
 * Grant or revoke admin privileges (Superadmin only)
 */
router.put('/users/:userId/admin', requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_admin, admin_permissions = [] } = req.body;

    if (typeof is_admin !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_admin must be a boolean'
      });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('users')
      .update({
        is_admin,
        admin_permissions: is_admin ? admin_permissions : []
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      is_admin ? 'grant_admin' : 'revoke_admin',
      'user',
      userId,
      { is_admin, admin_permissions },
      req
    );

    res.json({
      success: true,
      message: `Admin privileges ${is_admin ? 'granted' : 'revoked'} successfully`,
      data
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin status'
    });
  }
});

/**
 * GET /api/admin/subscriptions
 * Get paginated list of subscriptions
 */
router.get('/subscriptions', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '' } = req.query;
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        users!inner(id, name, email)
      `, { count: 'exact' });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: subscriptions, error, count } = await query;

    if (error) throw error;

    await logAdminActivity(req.user.id, 'list_subscriptions', 'subscriptions', null, { page, limit, status }, req);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
});

/**
 * PUT /api/admin/subscriptions/:subscriptionId/cancel
 * Cancel a subscription (Superadmin only)
 */
router.put('/subscriptions/:subscriptionId/cancel', requireSuperAdmin, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const supabase = getSupabase();

    // Get subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (fetchError || !subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Cancel subscription in Stripe if stripe_subscription_id exists
    if (subscription.stripe_subscription_id) {
      try {
        const stripeInstance = stripe.getStripe();
        await stripeInstance.subscriptions.cancel(subscription.stripe_subscription_id);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Update subscription status in database
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      'cancel_subscription',
      'subscription',
      subscriptionId,
      { user_id: subscription.user_id },
      req
    );

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
      data
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

/**
 * GET /api/admin/support-tickets
 * Get paginated list of support tickets
 */
router.get('/support-tickets', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '', priority = '' } = req.query;
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        users!inner(id, name, email)
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: tickets, error, count } = await query;

    if (error) throw error;

    await logAdminActivity(req.user.id, 'list_tickets', 'support_tickets', null, { page, limit, status, priority }, req);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

/**
 * PUT /api/admin/support-tickets/:ticketId
 * Update support ticket (status, priority, assignment, notes)
 */
router.put('/support-tickets/:ticketId', requireAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, priority, assigned_to, admin_notes, response } = req.body;

    const supabase = getSupabase();

    // Build update object
    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    // Handle resolved status
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString();
    }

    // If adding a response, append to responses array
    if (response) {
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('responses')
        .eq('id', ticketId)
        .single();

      const existingResponses = ticket?.responses || [];
      updates.responses = [
        ...existingResponses,
        {
          admin_id: req.user.id,
          message: response,
          created_at: new Date().toISOString()
        }
      ];
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      'update_ticket',
      'support_ticket',
      ticketId,
      updates,
      req
    );

    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket'
    });
  }
});

/**
 * GET /api/admin/activity-log
 * Get admin activity log with pagination
 */
router.get('/activity-log', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, adminId = '' } = req.query;
    const offset = (page - 1) * limit;

    const supabase = getSupabase();
    let query = supabase
      .from('admin_activity_log')
      .select(`
        *,
        users!inner(id, name, email)
      `, { count: 'exact' });

    // Filter by admin if specified
    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    // Apply pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: activities, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log'
    });
  }
});

/**
 * GET /api/admin/settings
 * Get all system settings (Superadmin only)
 */
router.get('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;

    await logAdminActivity(req.user.id, 'view_settings', 'system_settings', null, {}, req);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

/**
 * PUT /api/admin/settings/:settingId
 * Update a system setting (Superadmin only)
 */
router.put('/settings/:settingId', requireSuperAdmin, async (req, res) => {
  try {
    const { settingId } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'value is required'
      });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value,
        updated_by: req.user.id
      })
      .eq('id', settingId)
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      'update_setting',
      'system_setting',
      settingId,
      { key: data.key, value },
      req
    );

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system setting'
    });
  }
});

module.exports = router;
