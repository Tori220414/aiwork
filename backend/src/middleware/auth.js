const jwt = require('jsonwebtoken');
const { getSupabase } = require('../config/supabase');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const supabase = getSupabase();
      if (!supabase) {
        return res.status(500).json({ message: 'Database connection not available' });
      }

      // Get user from token (exclude password)
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, avatar, preferences, is_active, created_at, last_login')
        .eq('id', decoded.id)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.is_active) {
        return res.status(403).json({ message: 'User account is deactivated' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin only middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

module.exports = { protect, admin, generateToken };
