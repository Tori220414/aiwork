const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-supabase');
const { getSupabase } = require('../config/supabase');

router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard overview data
// @access  Private
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all tasks for user
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (tasksError) {
      console.error('Dashboard tasks error:', tasksError);
      return res.status(500).json({ message: 'Error fetching tasks' });
    }

    const tasks = allTasks || [];

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

    const overdueTasks = tasks.filter(t =>
      t.status !== 'completed' &&
      t.status !== 'cancelled' &&
      t.due_date &&
      new Date(t.due_date) < today
    ).length;

    const todayTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today && dueDate < tomorrow;
    }).slice(0, 10);

    const upcomingTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= tomorrow;
    }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 10);

    // Get projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(5);

    // Calculate completion rate
    const completionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Get productivity score
    const productivityScore = Math.min(100, Math.round(
      (completionRate * 0.4) +
      (pendingTasks < 10 ? 30 : 15) +
      (overdueTasks === 0 ? 30 : Math.max(0, 30 - (overdueTasks * 3)))
    ));

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
        productivityScore
      },
      todayTasks: todayTasks.map(t => ({ ...t, _id: t.id })),
      upcomingTasks: upcomingTasks.map(t => ({ ...t, _id: t.id })),
      projects: (projects || []).map(p => ({ ...p, _id: p.id })),
      userStats: req.user.stats || {}
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data
// @access  Private
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { period = '7d' } = req.query;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get completed tasks
    const { data: completed } = await supabase
      .from('tasks')
      .select('completed_at, category, priority')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    // Group by date
    const completedByDate = {};
    (completed || []).forEach(task => {
      const date = task.completed_at?.split('T')[0];
      if (date) {
        completedByDate[date] = (completedByDate[date] || 0) + 1;
      }
    });

    const completedTasks = Object.entries(completedByDate).map(([date, count]) => ({
      _id: date,
      count
    }));

    // Get all tasks for category/priority stats
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('category, priority, status')
      .eq('user_id', userId);

    // Group by category
    const categoryMap = {};
    (allTasks || []).forEach(task => {
      categoryMap[task.category] = (categoryMap[task.category] || 0) + 1;
    });

    const tasksByCategory = Object.entries(categoryMap).map(([category, count]) => ({
      _id: category,
      count
    }));

    // Group by priority (excluding completed)
    const priorityMap = {};
    (allTasks || []).filter(t => t.status !== 'completed').forEach(task => {
      priorityMap[task.priority] = (priorityMap[task.priority] || 0) + 1;
    });

    const tasksByPriority = Object.entries(priorityMap).map(([priority, count]) => ({
      _id: priority,
      count
    }));

    res.json({
      completedTasks,
      tasksByCategory,
      tasksByPriority
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
