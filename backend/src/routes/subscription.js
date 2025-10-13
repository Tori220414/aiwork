const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-supabase');
const { getSupabase } = require('../config/supabase');
const { getStripe } = require('../config/stripe');

// All routes are protected
router.use(protect);

// @route   GET /api/subscription/status
// @desc    Get user subscription status
// @access  Private
router.get('/status', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status, trial_end_date, subscription_start_date')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(500).json({ message: 'Error fetching subscription' });
    }

    const trialDaysLeft = user.trial_end_date
      ? Math.ceil((new Date(user.trial_end_date) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      status: user.subscription_status,
      trial_end_date: user.trial_end_date,
      trial_days_left: trialDaysLeft > 0 ? trialDaysLeft : 0,
      is_trial: user.subscription_status === 'trial',
      is_active: user.subscription_status === 'active' || (user.subscription_status === 'trial' && trialDaysLeft > 0),
      subscription_start_date: user.subscription_start_date
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subscription/create-checkout
// @desc    Create Stripe checkout session
// @access  Private
router.post('/create-checkout', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const stripe = getStripe();
    const supabase = getSupabase();

    if (!stripe) {
      return res.status(503).json({ message: 'Payment system not configured' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId
        }
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Aurora Tasks Pro',
              description: 'AI-powered task management - $10.99/month after 30-day free trial'
            },
            recurring: {
              interval: 'month'
            },
            unit_amount: 1099 // $10.99 in cents
          },
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          user_id: userId
        }
      },
      success_url: `${process.env.CORS_ORIGIN}/billing?success=true`,
      cancel_url: `${process.env.CORS_ORIGIN}/billing?canceled=true`,
      metadata: {
        user_id: userId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ message: 'Error creating checkout session' });
  }
});

// @route   POST /api/subscription/create-portal
// @desc    Create Stripe customer portal session
// @access  Private
router.post('/create-portal', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const stripe = getStripe();
    const supabase = getSupabase();

    if (!stripe) {
      return res.status(503).json({ message: 'Payment system not configured' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!user.stripe_customer_id) {
      return res.status(400).json({ message: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.CORS_ORIGIN}/billing`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create portal error:', error);
    res.status(500).json({ message: 'Error creating portal session' });
  }
});

// @route   POST /api/subscription/webhook
// @desc    Handle Stripe webhooks
// @access  Public (but verified with Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = getStripe();
  const supabase = getSupabase();

  if (!stripe) {
    return res.status(503).send('Payment system not configured');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Stripe webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;

        await supabase
          .from('users')
          .update({
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id
          })
          .eq('id', userId);

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            plan_id: subscription.items.data[0]?.price?.id || 'pro_monthly',
            amount: subscription.items.data[0]?.price?.unit_amount || 1099,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
          }, {
            onConflict: 'stripe_subscription_id'
          });
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        const canceledUserId = deletedSub.metadata.user_id;

        await supabase
          .from('users')
          .update({
            subscription_status: 'canceled'
          })
          .eq('id', canceledUserId);

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', deletedSub.id);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;

        await supabase
          .from('payments')
          .insert({
            user_id: invoice.metadata?.user_id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'succeeded',
            receipt_url: invoice.hosted_invoice_url
          });
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
