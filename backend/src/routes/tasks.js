const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-supabase');
const { getSupabase } = require('../config/supabase');

// All routes are protected
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks for user with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, project, search, sortBy, limit, page } = req.query;
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Build query
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);
    if (project) query = query.eq('project_id', project);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting
    switch (sortBy) {
      case 'dueDate':
        query = query.order('due_date', { ascending: true, nullsFirst: false });
        break;
      case 'priority':
        query = query.order('priority_score', { ascending: false });
        break;
      case 'created':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    query = query.range(offset, offset + limitNum - 1);

    const { data: tasks, error, count } = await query;

    if (error) {
      console.error('Get tasks error:', error);
      return res.status(500).json({ message: 'Error fetching tasks' });
    }

    // Get total count
    const { count: total } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.json({
      tasks: (tasks || []).map(t => ({ ...t, _id: t.id })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total || 0,
        pages: Math.ceil((total || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ ...task, _id: task.id });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const taskData = {
      ...req.body,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Convert camelCase to snake_case for database
    if (taskData.dueDate) {
      taskData.due_date = taskData.dueDate;
      delete taskData.dueDate;
    }
    if (taskData.startDate) {
      taskData.start_date = taskData.startDate;
      delete taskData.startDate;
    }
    if (taskData.estimatedTime) {
      taskData.estimated_time = taskData.estimatedTime;
      delete taskData.estimatedTime;
    }
    if (taskData.actualTime) {
      taskData.actual_time = taskData.actualTime;
      delete taskData.actualTime;
    }
    if (taskData.priorityScore) {
      taskData.priority_score = taskData.priorityScore;
      delete taskData.priorityScore;
    }
    if (taskData.aiGenerated !== undefined) {
      taskData.ai_generated = taskData.aiGenerated;
      delete taskData.aiGenerated;
    }
    if (taskData.aiInsights) {
      taskData.ai_insights = taskData.aiInsights;
      delete taskData.aiInsights;
    }
    if (taskData.completedAt) {
      taskData.completed_at = taskData.completedAt;
      delete taskData.completedAt;
    }
    if (taskData.projectId) {
      taskData.project_id = taskData.projectId;
      delete taskData.projectId;
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('Create task error:', error);
      return res.status(500).json({ message: 'Error creating task' });
    }

    // Update user stats
    const { data: user } = await supabase
      .from('users')
      .select('stats')
      .eq('id', userId)
      .single();

    if (user) {
      const stats = user.stats || {};
      stats.totalTasksCreated = (stats.totalTasksCreated || 0) + 1;

      await supabase
        .from('users')
        .update({ stats })
        .eq('id', userId);
    }

    res.status(201).json({ ...task, _id: task.id });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get existing task
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const wasCompleted = existingTask.status === 'completed';
    const isNowCompleted = req.body.status === 'completed';

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.user_id;

    // Convert camelCase to snake_case
    if (updateData.dueDate) {
      updateData.due_date = updateData.dueDate;
      delete updateData.dueDate;
    }
    if (updateData.completedAt) {
      updateData.completed_at = updateData.completedAt;
      delete updateData.completedAt;
    }

    if (isNowCompleted && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update task error:', error);
      return res.status(500).json({ message: 'Error updating task' });
    }

    // Update user stats if task completed
    if (!wasCompleted && isNowCompleted) {
      const { data: user } = await supabase
        .from('users')
        .select('stats')
        .eq('id', userId)
        .single();

      if (user) {
        const stats = user.stats || {};
        stats.totalTasksCompleted = (stats.totalTasksCompleted || 0) + 1;

        await supabase
          .from('users')
          .update({ stats })
          .eq('id', userId);
      }
    }

    res.json({ ...task, _id: task.id });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete task error:', error);
      return res.status(500).json({ message: 'Error deleting task' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks/:id/subtask
// @desc    Add subtask to task
// @access  Private
router.post('/:id/subtask', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { data: task } = await supabase
      .from('tasks')
      .select('subtasks')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtasks = task.subtasks || [];
    subtasks.push(req.body);

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update({ subtasks })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Error adding subtask' });
    }

    res.json({ ...updatedTask, _id: updatedTask.id });
  } catch (error) {
    console.error('Add subtask error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
