const Stripe = require('stripe');

let stripe = null;

const initializeStripe = () => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    console.warn('⚠️  Warning: STRIPE_SECRET_KEY not set. Subscription features will be disabled.');
    return null;
  }

  try {
    stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    console.log('✅ Stripe initialized successfully');
    return stripe;
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
    return null;
  }
};

const getStripe = () => {
  if (!stripe) {
    stripe = initializeStripe();
  }
  return stripe;
};

module.exports = {
  initializeStripe,
  getStripe
};
