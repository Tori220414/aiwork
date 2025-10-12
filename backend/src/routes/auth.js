const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const { generateToken, protect } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(400).json({ message: 'Failed to create user' });
    }

    if (user) {
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences,
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, preferences, is_active, created_at, last_login')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Database connection not available' });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.preferences) {
      updates.preferences = {
        ...user.preferences,
        ...req.body.preferences
      };
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
