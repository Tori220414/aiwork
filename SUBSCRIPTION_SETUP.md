# 💳 Aurora Tasks Subscription Setup Guide

## Overview
- **Free Trial**: 30 days
- **Price**: $10.99/month after trial
- **Payment Provider**: Stripe

## 🔧 Setup Steps

### 1. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete account verification
3. Get your API keys from https://dashboard.stripe.com/apikeys

### 2. Configure Supabase
Run the subscription schema in Supabase SQL Editor:
```bash
# File: backend/database/subscription_schema.sql
```

This creates:
- Subscription tracking tables
- Payment history
- Trial management functions

### 3. Set Environment Variables

#### Railway (Backend)
Add these to Railway environment variables:
```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (get this after setting up webhook)
```

#### Vercel (Frontend) - Optional
If you want to use Stripe.js on frontend:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
```

### 4. Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Set endpoint URL: `https://aiwork-production.up.railway.app/api/subscription/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add it to Railway as `STRIPE_WEBHOOK_SECRET`

### 5. Create Stripe Product (Optional)

You can create a product in Stripe Dashboard or let the code create it automatically.

To create manually:
1. Go to https://dashboard.stripe.com/products
2. Click **"Add product"**
3. Name: **Aurora Tasks Pro**
4. Price: **$10.99/month**
5. Copy the **Price ID** (starts with `price_...`)
6. Update the code to use this price ID if needed

## 📱 How It Works

### User Flow:
1. **Registration** → User gets 30-day free trial automatically
2. **Trial Period** → Full access to all features
3. **Trial Ending** → User sees notification to subscribe
4. **Subscription** → User clicks "Subscribe" → Stripe Checkout
5. **Payment** → $10.99/month charged after trial ends
6. **Active** → Continued access to all features

### Subscription States:
- `trial` - User in free 30-day trial
- `active` - Paying subscriber
- `past_due` - Payment failed, grace period
- `canceled` - Subscription ended

## 🔐 Security Notes

- Never expose `STRIPE_SECRET_KEY` in frontend
- Always verify webhook signatures
- Use HTTPS in production
- Test with Stripe test keys before going live

## 🧪 Testing

### Test Cards:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

Any future expiry date and any 3-digit CVC works with test cards.

## 📊 Monitoring

- View subscriptions: https://dashboard.stripe.com/subscriptions
- View payments: https://dashboard.stripe.com/payments
- View customers: https://dashboard.stripe.com/customers
- View webhooks: https://dashboard.stripe.com/webhooks

## 🚀 Go Live Checklist

- [ ] Switch from test keys to live keys
- [ ] Update webhook endpoint to use live mode
- [ ] Test full payment flow with real card
- [ ] Set up email notifications for failed payments
- [ ] Configure tax settings (if needed)
- [ ] Set up billing portal for customers
