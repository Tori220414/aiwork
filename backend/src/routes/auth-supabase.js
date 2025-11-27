const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getSupabase } = require('../config/supabase');
const { generateToken, protect } = require('../middleware/auth-supabase');
const { sendPasswordResetEmail } = require('../services/emailService');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.error('Supabase not initialized');
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ message: 'Database error: ' + checkError.message });
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: 'user',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        message: 'Failed to create user',
        error: error.message,
        details: error.details || error.hint
      });
    }

    // Remove password from response
    delete user.password;

    res.status(201).json({
      ...user,
      _id: user.id,
      token: generateToken(user.id)
    });
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
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

    // Remove password from response
    delete user.password;

    res.json({
      ...user,
      _id: user.id,
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
      return res.status(503).json({ message: 'Database not configured' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, avatar, preferences, stats, created_at')
      .eq('id', req.user._id || req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ ...user, _id: user.id });
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
      return res.status(503).json({ message: 'Database not configured' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.preferences) updates.preferences = req.body.preferences;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user._id || req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    delete user.password;
    res.json({ ...user, _id: user.id });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address' });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success message to prevent email enumeration
    if (findError || !user) {
      console.log('Password reset requested for non-existent email:', email);
      return res.json({
        message: 'If an account exists with this email, you will receive a password reset link shortly.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Save reset token to user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetTokenHash,
        reset_token_expires: resetTokenExpiry
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error saving reset token:', updateError);
      return res.status(500).json({ message: 'Failed to process password reset request' });
    }

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send reset email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      userName: user.name
    });

    if (!emailResult.sent) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Still return success to prevent email enumeration
    }

    console.log('Password reset email sent to:', email);

    res.json({
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error processing password reset request' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, token, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, reset_token, reset_token_expires')
      .eq('email', email.toLowerCase())
      .single();

    if (findError || !user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    // Verify token matches and hasn't expired
    if (user.reset_token !== tokenHash) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ message: 'Failed to reset password' });
    }

    console.log('Password reset successful for:', email);

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password (for logged in users)
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ message: 'Database not configured' });
    }

    // Get user with password
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', req.user._id || req.user.id)
      .single();

    if (findError || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ message: 'Failed to change password' });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

module.exports = router;
