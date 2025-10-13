const { getSupabase } = require('../config/supabase');

/**
 * Middleware to verify user has admin privileges
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const supabase = getSupabase();

    // Check if user is admin or superadmin
    const { data: user, error } = await supabase
      .from('users')
      .select('is_admin, is_superadmin, admin_permissions')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(403).json({
        success: false,
        message: 'Admin access denied'
      });
    }

    if (!user.is_admin && !user.is_superadmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    // Attach admin info to request for downstream use
    req.admin = {
      isAdmin: user.is_admin,
      isSuperAdmin: user.is_superadmin,
      permissions: user.admin_permissions || []
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during admin authentication'
    });
  }
};

/**
 * Middleware to verify user has superadmin privileges
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const supabase = getSupabase();

    // Check if user is superadmin
    const { data: user, error } = await supabase
      .from('users')
      .select('is_superadmin')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(403).json({
        success: false,
        message: 'Superadmin access denied'
      });
    }

    if (!user.is_superadmin) {
      return res.status(403).json({
        success: false,
        message: 'Superadmin privileges required'
      });
    }

    req.admin = {
      isAdmin: true,
      isSuperAdmin: true,
      permissions: []
    };

    next();
  } catch (error) {
    console.error('Superadmin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during superadmin authentication'
    });
  }
};

/**
 * Check if user has specific admin permission
 */
const hasPermission = (req, permission) => {
  if (req.admin?.isSuperAdmin) {
    return true; // Superadmins have all permissions
  }

  return req.admin?.permissions?.includes(permission) || false;
};

/**
 * Log admin activity for audit trail
 */
const logAdminActivity = async (adminId, action, resourceType, resourceId = null, details = {}, req = null) => {
  try {
    const supabase = getSupabase();

    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: adminId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: req?.ip || null,
        user_agent: req?.headers?.['user-agent'] || null
      });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
    // Don't throw - logging failure shouldn't break the request
  }
};

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  hasPermission,
  logAdminActivity
};
