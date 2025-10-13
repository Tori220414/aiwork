const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Create daily takings
router.post('/:workspaceId/daily-takings', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const {
      week_starting,
      week_ending,
      days,
      weekly_total,
      status,
      notes
    } = req.body;

    const supabase = getSupabase();

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (workspaceError || !workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Create daily takings
    const { data: takings, error } = await supabase
      .from('daily_takings')
      .insert({
        workspace_id: workspaceId,
        week_starting,
        week_ending,
        days,
        weekly_total,
        status: status || 'draft',
        notes,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating daily takings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create daily takings'
      });
    }

    res.status(201).json({
      success: true,
      takings
    });
  } catch (error) {
    console.error('Error in create daily takings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all daily takings for a workspace
router.get('/:workspaceId/daily-takings', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .eq('user_id', req.user.id)
      .single();

    if (workspaceError || !workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Get daily takings
    const { data: takings, error } = await supabase
      .from('daily_takings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('week_starting', { ascending: false });

    if (error) {
      console.error('Error fetching daily takings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch daily takings'
      });
    }

    res.json({
      success: true,
      takings: takings || []
    });
  } catch (error) {
    console.error('Error in get daily takings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update daily takings
router.put('/:workspaceId/daily-takings/:takingsId', async (req, res) => {
  try {
    const { workspaceId, takingsId } = req.params;
    const updateData = req.body;

    const supabase = getSupabase();

    // Verify user has access to workspace and takings
    const { data: takings, error: takingsError } = await supabase
      .from('daily_takings')
      .select('*, workspaces!inner(user_id)')
      .eq('id', takingsId)
      .eq('workspace_id', workspaceId)
      .single();

    if (takingsError || !takings || takings.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Daily takings not found'
      });
    }

    // Update daily takings
    const { data: updatedTakings, error } = await supabase
      .from('daily_takings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', takingsId)
      .select()
      .single();

    if (error) {
      console.error('Error updating daily takings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update daily takings'
      });
    }

    res.json({
      success: true,
      takings: updatedTakings
    });
  } catch (error) {
    console.error('Error in update daily takings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete daily takings
router.delete('/:workspaceId/daily-takings/:takingsId', async (req, res) => {
  try {
    const { workspaceId, takingsId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and takings
    const { data: takings, error: takingsError } = await supabase
      .from('daily_takings')
      .select('*, workspaces!inner(user_id)')
      .eq('id', takingsId)
      .eq('workspace_id', workspaceId)
      .single();

    if (takingsError || !takings || takings.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Daily takings not found'
      });
    }

    // Delete daily takings
    const { error } = await supabase
      .from('daily_takings')
      .delete()
      .eq('id', takingsId);

    if (error) {
      console.error('Error deleting daily takings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete daily takings'
      });
    }

    res.json({
      success: true,
      message: 'Daily takings deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete daily takings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
