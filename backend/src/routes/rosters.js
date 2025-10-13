const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Create roster
router.post('/:workspaceId/rosters', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const {
      week_starting,
      week_ending,
      shifts,
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

    // Create roster
    const { data: roster, error } = await supabase
      .from('rosters')
      .insert({
        workspace_id: workspaceId,
        week_starting,
        week_ending,
        shifts,
        status: status || 'draft',
        notes,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating roster:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create roster'
      });
    }

    res.status(201).json({
      success: true,
      roster
    });
  } catch (error) {
    console.error('Error in create roster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all rosters for a workspace
router.get('/:workspaceId/rosters', async (req, res) => {
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

    // Get rosters
    const { data: rosters, error } = await supabase
      .from('rosters')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('week_starting', { ascending: false });

    if (error) {
      console.error('Error fetching rosters:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch rosters'
      });
    }

    res.json({
      success: true,
      rosters: rosters || []
    });
  } catch (error) {
    console.error('Error in get rosters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update roster
router.put('/:workspaceId/rosters/:rosterId', async (req, res) => {
  try {
    const { workspaceId, rosterId } = req.params;
    const updateData = req.body;

    const supabase = getSupabase();

    // Verify user has access to workspace and roster
    const { data: roster, error: rosterError } = await supabase
      .from('rosters')
      .select('*, workspaces!inner(user_id)')
      .eq('id', rosterId)
      .eq('workspace_id', workspaceId)
      .single();

    if (rosterError || !roster || roster.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Roster not found'
      });
    }

    // Update roster
    const { data: updatedRoster, error } = await supabase
      .from('rosters')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', rosterId)
      .select()
      .single();

    if (error) {
      console.error('Error updating roster:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update roster'
      });
    }

    res.json({
      success: true,
      roster: updatedRoster
    });
  } catch (error) {
    console.error('Error in update roster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete roster
router.delete('/:workspaceId/rosters/:rosterId', async (req, res) => {
  try {
    const { workspaceId, rosterId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and roster
    const { data: roster, error: rosterError } = await supabase
      .from('rosters')
      .select('*, workspaces!inner(user_id)')
      .eq('id', rosterId)
      .eq('workspace_id', workspaceId)
      .single();

    if (rosterError || !roster || roster.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Roster not found'
      });
    }

    // Delete roster
    const { error } = await supabase
      .from('rosters')
      .delete()
      .eq('id', rosterId);

    if (error) {
      console.error('Error deleting roster:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete roster'
      });
    }

    res.json({
      success: true,
      message: 'Roster deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete roster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
