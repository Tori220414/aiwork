const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

/**
 * POST /api/support/tickets
 * Submit a new support ticket
 */
router.post('/tickets', async (req, res) => {
  try {
    const { subject, message, category = 'general', priority = 'normal' } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const supabase = getSupabase();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: req.user.id,
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support ticket'
    });
  }
});

/**
 * GET /api/support/tickets
 * Get all support tickets for the authenticated user
 */
router.get('/tickets', async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      tickets: tickets || []
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets'
    });
  }
});

/**
 * GET /api/support/tickets/:ticketId
 * Get a specific support ticket
 */
router.get('/tickets/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const supabase = getSupabase();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support ticket'
    });
  }
});

module.exports = router;
