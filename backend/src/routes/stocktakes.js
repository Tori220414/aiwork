const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Create stocktake
router.post('/:workspaceId/stocktakes', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const {
      stocktake_number,
      date,
      conducted_by,
      items,
      total_variance_value,
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

    // Create stocktake
    const { data: stocktake, error } = await supabase
      .from('stocktakes')
      .insert({
        workspace_id: workspaceId,
        stocktake_number,
        date: date || new Date().toISOString(),
        conducted_by,
        items,
        total_variance_value,
        status: status || 'draft',
        notes,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stocktake:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create stocktake'
      });
    }

    res.status(201).json({
      success: true,
      stocktake
    });
  } catch (error) {
    console.error('Error in create stocktake:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all stocktakes for a workspace
router.get('/:workspaceId/stocktakes', async (req, res) => {
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

    // Get stocktakes
    const { data: stocktakes, error } = await supabase
      .from('stocktakes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stocktakes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stocktakes'
      });
    }

    res.json({
      success: true,
      stocktakes: stocktakes || []
    });
  } catch (error) {
    console.error('Error in get stocktakes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update stocktake
router.put('/:workspaceId/stocktakes/:stocktakeId', async (req, res) => {
  try {
    const { workspaceId, stocktakeId } = req.params;
    const updateData = req.body;

    const supabase = getSupabase();

    // Verify user has access to workspace and stocktake
    const { data: stocktake, error: stocktakeError } = await supabase
      .from('stocktakes')
      .select('*, workspaces!inner(user_id)')
      .eq('id', stocktakeId)
      .eq('workspace_id', workspaceId)
      .single();

    if (stocktakeError || !stocktake || stocktake.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Stocktake not found'
      });
    }

    // Update stocktake
    const { data: updatedStocktake, error } = await supabase
      .from('stocktakes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', stocktakeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating stocktake:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update stocktake'
      });
    }

    res.json({
      success: true,
      stocktake: updatedStocktake
    });
  } catch (error) {
    console.error('Error in update stocktake:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete stocktake
router.delete('/:workspaceId/stocktakes/:stocktakeId', async (req, res) => {
  try {
    const { workspaceId, stocktakeId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and stocktake
    const { data: stocktake, error: stocktakeError } = await supabase
      .from('stocktakes')
      .select('*, workspaces!inner(user_id)')
      .eq('id', stocktakeId)
      .eq('workspace_id', workspaceId)
      .single();

    if (stocktakeError || !stocktake || stocktake.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Stocktake not found'
      });
    }

    // Delete stocktake
    const { error } = await supabase
      .from('stocktakes')
      .delete()
      .eq('id', stocktakeId);

    if (error) {
      console.error('Error deleting stocktake:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete stocktake'
      });
    }

    res.json({
      success: true,
      message: 'Stocktake deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete stocktake:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
