const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSupabase } = require('../config/supabase');

// Protect all routes
router.use(protect);

// Get all products for a workspace
router.get('/:workspaceId/products', async (req, res) => {
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

    // Get products
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('product', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch products'
      });
    }

    res.json({
      success: true,
      products: products || []
    });
  } catch (error) {
    console.error('Error in get products:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new product
router.post('/:workspaceId/products', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { product, category, unit, value_per_unit } = req.body;

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

    // Check if product already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('product', product)
      .eq('category', category)
      .single();

    if (existingProduct) {
      return res.status(200).json({
        success: true,
        product: existingProduct,
        message: 'Product already exists'
      });
    }

    // Create product
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        workspace_id: workspaceId,
        product,
        category,
        unit,
        value_per_unit,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create product'
      });
    }

    res.status(201).json({
      success: true,
      product: newProduct
    });
  } catch (error) {
    console.error('Error in create product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete a product
router.delete('/:workspaceId/products/:productId', async (req, res) => {
  try {
    const { workspaceId, productId } = req.params;
    const supabase = getSupabase();

    // Verify user has access to workspace and product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, workspaces!inner(user_id)')
      .eq('id', productId)
      .eq('workspace_id', workspaceId)
      .single();

    if (productError || !product || product.workspaces.user_id !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete product'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
