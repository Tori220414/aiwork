const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Create order
router.post('/:workspaceId/orders', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const {
      order_number,
      supplier,
      supplier_contact,
      order_date,
      delivery_date,
      items,
      subtotal,
      tax_amount,
      total,
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

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        workspace_id: workspaceId,
        order_number,
        supplier,
        supplier_contact,
        order_date: order_date || new Date().toISOString(),
        delivery_date,
        items,
        subtotal,
        tax_amount,
        total,
        status: status || 'pending',
        notes,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create order'
      });
    }

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error in create order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all orders for a workspace
router.get('/:workspaceId/orders', async (req, res) => {
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

    // Get orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders'
      });
    }

    res.json({
      success: true,
      orders: orders || []
    });
  } catch (error) {
    console.error('Error in get orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update order
router.put('/:workspaceId/orders/:orderId', async (req, res) => {
  try {
    const { workspaceId, orderId } = req.params;
    const updateData = req.body;

    const supabase = getSupabase();

    // Verify user has access to workspace and order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, workspaces!inner(user_id)')
      .eq('id', orderId)
      .eq('workspace_id', workspaceId)
      .single();

    if (orderError || !order || order.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update order'
      });
    }

    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error in update order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete order
router.delete('/:workspaceId/orders/:orderId', async (req, res) => {
  try {
    const { workspaceId, orderId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, workspaces!inner(user_id)')
      .eq('id', orderId)
      .eq('workspace_id', workspaceId)
      .single();

    if (orderError || !order || order.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete order'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
