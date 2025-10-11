const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const { protect } = require('../middleware/auth-supabase');
const { getSupabase } = require('../config/supabase');

router.use(protect);

// @route   POST /api/ai/extract-tasks
// @desc    Extract tasks from text using AI
// @access  Private
router.post('/extract-tasks', async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const extractedTasks = await geminiService.extractTasksFromText(text);
    console.log('Gemini extracted tasks:', extractedTasks);

    // Create tasks in database
    const createdTasks = [];
    for (const taskData of extractedTasks) {
      // Convert camelCase to snake_case
      const dbTaskData = {
        user_id: userId,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status || 'pending',
        category: taskData.category,
        ai_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (taskData.dueDate) dbTaskData.due_date = taskData.dueDate;
      if (taskData.estimatedTime) dbTaskData.estimated_time = taskData.estimatedTime;
      if (taskData.tags) dbTaskData.tags = taskData.tags;
      if (taskData.priorityScore) dbTaskData.priority_score = taskData.priorityScore;

      const { data: task, error } = await supabase
        .from('tasks')
        .insert([dbTaskData])
        .select()
        .single();

      if (!error && task) {
        createdTasks.push({ ...task, _id: task.id });
      }
    }

    // Update user stats
    const { data: user } = await supabase
      .from('users')
      .select('stats')
      .eq('id', userId)
      .single();

    if (user) {
      const stats = user.stats || {};
      stats.totalTasksCreated = (stats.totalTasksCreated || 0) + createdTasks.length;

      await supabase
        .from('users')
        .update({ stats })
        .eq('id', userId);
    }

    res.json({
      message: `Successfully created ${createdTasks.length} tasks from text`,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('Extract tasks error:', error);
    res.status(500).json({ message: 'Failed to extract tasks', error: error.message });
  }
});

// @route   POST /api/ai/prioritize
// @desc    Prioritize tasks using AI
// @access  Private
router.post('/prioritize', async (req, res) => {
  try {
    const { taskIds } = req.body;
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'Task IDs array is required' });
    }

    // Get tasks
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)
      .eq('user_id', userId);

    if (fetchError || !tasks || tasks.length === 0) {
      return res.status(404).json({ message: 'No tasks found' });
    }

    // Convert snake_case to camelCase for AI service
    const tasksForAI = tasks.map(t => ({
      ...t,
      _id: t.id,
      dueDate: t.due_date,
      priorityScore: t.priority_score,
      aiInsights: t.ai_insights
    }));

    // Get AI prioritization
    const prioritizedTasks = await geminiService.prioritizeTasks(tasksForAI);

    // Update tasks with AI insights
    const updatedTasks = [];
    for (const aiTask of prioritizedTasks) {
      const { data: task, error } = await supabase
        .from('tasks')
        .update({
          priority_score: aiTask.priorityScore,
          ai_insights: aiTask.aiInsights,
          updated_at: new Date().toISOString()
        })
        .eq('id', aiTask._id)
        .eq('user_id', userId)
        .select()
        .single();

      if (!error && task) {
        updatedTasks.push({ ...task, _id: task.id });
      }
    }

    res.json({
      message: 'Tasks prioritized successfully',
      tasks: updatedTasks
    });
  } catch (error) {
    console.error('Prioritize tasks error:', error);
    res.status(500).json({ message: 'Failed to prioritize tasks', error: error.message });
  }
});

// @route   POST /api/ai/daily-plan
// @desc    Generate daily plan using AI
// @access  Private
router.post('/daily-plan', async (req, res) => {
  try {
    const { date } = req.body;
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    const targetDate = date ? new Date(date) : new Date();

    // Get tasks for the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get tasks due today, overdue tasks, and tasks without due dates
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'completed')
      .or(`due_date.gte.${startOfDay.toISOString()},due_date.is.null,due_date.lt.${startOfDay.toISOString()}`)
      .order('priority_score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Daily plan fetch error:', error);
      return res.status(500).json({ message: 'Error fetching tasks' });
    }

    // Convert snake_case to camelCase for AI service
    const tasksForAI = (tasks || []).map(t => ({
      ...t,
      _id: t.id,
      dueDate: t.due_date,
      priorityScore: t.priority_score,
      estimatedTime: t.estimated_time
    }));

    const dailyPlan = await geminiService.generateDailyPlan(
      tasksForAI,
      req.user.preferences
    );

    res.json({
      date: targetDate,
      plan: dailyPlan,
      tasksIncluded: tasksForAI.length
    });
  } catch (error) {
    console.error('Daily plan error:', error);
    res.status(500).json({ message: 'Failed to generate daily plan', error: error.message });
  }
});

// @route   GET /api/ai/productivity-analysis
// @desc    Get AI-powered productivity analysis
// @access  Private
router.get('/productivity-analysis', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const userId = req.user._id || req.user.id;
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
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get completed tasks
    const { data: completedTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    if (error) {
      console.error('Productivity analysis fetch error:', error);
      return res.status(500).json({ message: 'Error fetching completed tasks' });
    }

    // Convert snake_case to camelCase for AI service
    const tasksForAI = (completedTasks || []).map(t => ({
      ...t,
      _id: t.id,
      completedAt: t.completed_at,
      estimatedTime: t.estimated_time,
      actualTime: t.actual_time
    }));

    // Prepare time data
    const timeData = {
      period,
      totalDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
      tasksCompleted: tasksForAI.length,
      avgTasksPerDay: tasksForAI.length / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    };

    const analysis = await geminiService.analyzeProductivity(
      tasksForAI,
      timeData
    );

    res.json({
      period,
      analysis,
      dataPoints: tasksForAI.length
    });
  } catch (error) {
    console.error('Productivity analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze productivity', error: error.message });
  }
});

// @route   POST /api/ai/meeting-prep
// @desc    Generate meeting preparation
// @access  Private
router.post('/meeting-prep', async (req, res) => {
  try {
    const meetingInfo = req.body;

    if (!meetingInfo.title) {
      return res.status(400).json({ message: 'Meeting title is required' });
    }

    const prep = await geminiService.generateMeetingPrep(meetingInfo);

    res.json({
      meeting: meetingInfo,
      preparation: prep
    });
  } catch (error) {
    console.error('Meeting prep error:', error);
    res.status(500).json({ message: 'Failed to generate meeting preparation', error: error.message });
  }
});

// @route   POST /api/ai/suggest-tasks
// @desc    Get AI task suggestions
// @access  Private
router.post('/suggest-tasks', async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get recent tasks
    const { data: recentTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Suggest tasks fetch error:', error);
      return res.status(500).json({ message: 'Error fetching recent tasks' });
    }

    // Convert snake_case to camelCase for AI service
    const tasksForAI = (recentTasks || []).map(t => ({
      ...t,
      _id: t.id,
      updatedAt: t.updated_at
    }));

    const context = {
      currentTasks: tasksForAI,
      userRole: req.body.userRole || 'professional',
      timeOfDay: now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      recentActivity: req.body.recentActivity || []
    };

    const suggestions = await geminiService.suggestTasks(context);

    res.json({
      suggestions,
      context: {
        timeOfDay: context.timeOfDay,
        dayOfWeek: context.dayOfWeek
      }
    });
  } catch (error) {
    console.error('Task suggestions error:', error);
    res.status(500).json({ message: 'Failed to generate suggestions', error: error.message });
  }
});

module.exports = router;
