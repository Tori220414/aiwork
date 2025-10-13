const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Get all staff for a workspace
router.get('/:workspaceId/staff', async (req, res) => {
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

    // Get staff
    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching staff:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch staff'
      });
    }

    res.json({
      success: true,
      staff: staff || []
    });
  } catch (error) {
    console.error('Error in get staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new staff member
router.post('/:workspaceId/staff', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, position, phone, email } = req.body;

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

    // Check if staff member already exists
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('name', name)
      .single();

    if (existingStaff) {
      return res.status(200).json({
        success: true,
        staff: existingStaff,
        message: 'Staff member already exists'
      });
    }

    // Create staff member
    const { data: newStaff, error } = await supabase
      .from('staff')
      .insert({
        workspace_id: workspaceId,
        name,
        position,
        phone: phone || null,
        email: email || null,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating staff:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create staff member'
      });
    }

    res.status(201).json({
      success: true,
      staff: newStaff
    });
  } catch (error) {
    console.error('Error in create staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a staff member
router.delete('/:workspaceId/staff/:staffId', async (req, res) => {
  try {
    const { workspaceId, staffId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and staff
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*, workspaces!inner(user_id)')
      .eq('id', staffId)
      .eq('workspace_id', workspaceId)
      .single();

    if (staffError || !staff || staff.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Delete staff member
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId);

    if (error) {
      console.error('Error deleting staff:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete staff member'
      });
    }

    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
