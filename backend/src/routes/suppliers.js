const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Get all suppliers for a workspace
router.get('/:workspaceId/suppliers', async (req, res) => {
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

    // Get suppliers
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching suppliers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch suppliers'
      });
    }

    res.json({
      success: true,
      suppliers: suppliers || []
    });
  } catch (error) {
    console.error('Error in get suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new supplier
router.post('/:workspaceId/suppliers', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, contact_person, phone, email, address } = req.body;

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

    // Check if supplier already exists
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('name', name)
      .single();

    if (existingSupplier) {
      return res.status(200).json({
        success: true,
        supplier: existingSupplier,
        message: 'Supplier already exists'
      });
    }

    // Create supplier
    const { data: newSupplier, error } = await supabase
      .from('suppliers')
      .insert({
        workspace_id: workspaceId,
        name,
        contact_person: contact_person || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create supplier'
      });
    }

    res.status(201).json({
      success: true,
      supplier: newSupplier
    });
  } catch (error) {
    console.error('Error in create supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a supplier
router.delete('/:workspaceId/suppliers/:supplierId', async (req, res) => {
  try {
    const { workspaceId, supplierId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and supplier
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*, workspaces!inner(user_id)')
      .eq('id', supplierId)
      .eq('workspace_id', workspaceId)
      .single();

    if (supplierError || !supplier || supplier.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Delete supplier
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);

    if (error) {
      console.error('Error deleting supplier:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete supplier'
      });
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
