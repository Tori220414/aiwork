const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Create invoice
router.post('/:workspaceId/invoices', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { invoice_number, client_name, client_email, client_address, items, notes, tax_rate, status, due_date } = req.body;

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

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax_amount = (subtotal * tax_rate) / 100;
    const total = subtotal + tax_amount;

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        workspace_id: workspaceId,
        invoice_number,
        client_name,
        client_email,
        client_address,
        items,
        notes,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        status: status || 'draft',
        due_date: due_date || null,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create invoice'
      });
    }

    res.status(201).json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('Error in create invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all invoices for a workspace
router.get('/:workspaceId/invoices', async (req, res) => {
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

    // Get invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch invoices'
      });
    }

    res.json({
      success: true,
      invoices: invoices || []
    });
  } catch (error) {
    console.error('Error in get invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update invoice
router.put('/:workspaceId/invoices/:invoiceId', async (req, res) => {
  try {
    const { workspaceId, invoiceId } = req.params;
    const { invoice_number, client_name, client_email, client_address, items, notes, tax_rate, status, due_date } = req.body;

    const supabase = getSupabase();

    // Verify user has access to workspace and invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, workspaces!inner(user_id)')
      .eq('id', invoiceId)
      .eq('workspace_id', workspaceId)
      .single();

    if (invoiceError || !invoice || invoice.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax_amount = (subtotal * tax_rate) / 100;
    const total = subtotal + tax_amount;

    // Update invoice
    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .update({
        invoice_number,
        client_name,
        client_email,
        client_address,
        items,
        notes,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        status,
        due_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update invoice'
      });
    }

    res.json({
      success: true,
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Error in update invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete invoice
router.delete('/:workspaceId/invoices/:invoiceId', async (req, res) => {
  try {
    const { workspaceId, invoiceId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, workspaces!inner(user_id)')
      .eq('id', invoiceId)
      .eq('workspace_id', workspaceId)
      .single();

    if (invoiceError || !invoice || invoice.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Delete invoice
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (error) {
      console.error('Error deleting invoice:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete invoice'
      });
    }

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
