<<<<<<< HEAD
# 💳 Stripe Keys Setup Instructions

## 🎯 Overview

This guide shows you how to obtain and configure your Stripe API keys for GreenScape Lux.

---

## 📍 Where to Get Stripe Keys

### 1. Go to Stripe Dashboard
Visit: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)

### 2. Locate Your Keys

You'll see two types of keys:

#### **Publishable Key** (Client-Side)
- Starts with: `pk_live_`
- Safe to expose in browser
- Used for Stripe Elements (payment forms)
- **Add to Vercel** as `VITE_STRIPE_PUBLIC_KEY`

#### **Secret Key** (Server-Side)
- Starts with: `sk_live_`
- Must be kept secret
- Used for server-side operations
- **Add to Supabase Secrets** as `STRIPE_SECRET_KEY`

---

## 🔧 Setup Instructions

### **Step 1: Get Publishable Key**

1. Go to [Stripe API Keys](https://dashboard.stripe.com/apikeys)
2. Find **Publishable key** in the "Standard keys" section
3. Click "Reveal live key token"
4. Copy the key (starts with `pk_live_`)

### **Step 2: Add to Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **greenscape-lux-live** project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `VITE_STRIPE_PUBLIC_KEY`
   - **Value:** `pk_live_your_actual_key_here`
   - **Environment:** ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**

### **Step 3: Get Secret Key**

1. Go to [Stripe API Keys](https://dashboard.stripe.com/apikeys)
2. Find **Secret key** in the "Standard keys" section
3. Click "Reveal live key token"
4. Copy the key (starts with `sk_live_`)

### **Step 4: Add to Supabase Secrets**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select **mwvcbedvnimabfwubazz** project
3. Go to **Project Settings** → **Edge Functions** → **Secrets**
4. Add new secret:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** `sk_live_your_actual_secret_key_here`
5. Click **Save**

---

## 🔗 Webhook Setup

### **Step 5: Create Webhook Endpoint**

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://mwvcbedvnimabfwubazz.functions.supabase.co/stripe-webhook
   ```
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.failed`
   - Or select **"Select all events"** for comprehensive coverage
5. Click **Add endpoint**

### **Step 6: Get Webhook Secret**

1. After creating the endpoint, you'll see a **Signing secret**
2. Click to reveal the secret (starts with `whsec_`)
3. Copy the secret

### **Step 7: Add Webhook Secret to Supabase**

1. Go to Supabase Dashboard → **Edge Functions** → **Secrets**
2. Add new secret:
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_your_actual_webhook_secret_here`
3. Click **Save**

---

## ✅ Verification Checklist

- [ ] Stripe publishable key obtained from dashboard
- [ ] `VITE_STRIPE_PUBLIC_KEY` added to Vercel
- [ ] Stripe secret key obtained from dashboard
- [ ] `STRIPE_SECRET_KEY` added to Supabase Secrets
- [ ] Webhook endpoint created in Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` added to Supabase Secrets
- [ ] Test payment processed successfully
- [ ] Webhook events received and logged

---

## 🧪 Testing Your Setup

### **Test Payment Flow:**

1. Go to your live site
2. Navigate to a payment page
3. Use Stripe test card: `4242 4242 4242 4242`
4. Enter any future expiry date and any CVC
5. Submit payment
6. Check Stripe Dashboard for transaction
7. Verify webhook event was received

### **Check Webhook Delivery:**

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View **Recent deliveries**
4. Ensure events show "Success" status
5. If failed, check Supabase Edge Function logs

---

## 🔒 Security Best Practices

✅ **DO:**
- Keep secret key in Supabase Secrets only
- Use publishable key in frontend code
- Rotate keys if compromised
- Monitor webhook delivery

❌ **DON'T:**
- Add secret key to Vercel (client-side)
- Commit keys to GitHub
- Share keys in plain text
- Use test keys in production

---

## 🆘 Troubleshooting

**Payment not processing?**
- Verify `VITE_STRIPE_PUBLIC_KEY` is set in Vercel
- Check browser console for Stripe errors
- Ensure key starts with `pk_live_` (not `pk_test_`)

**Webhook not receiving events?**
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Test webhook delivery in Stripe Dashboard
- Check Supabase Edge Function logs

**"Invalid API Key" error?**
- Ensure you're using live keys (not test keys)
- Verify keys are copied correctly (no extra spaces)
- Redeploy after adding keys

---

## 📚 Additional Resources

- [Stripe API Keys Documentation](https://stripe.com/docs/keys)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- See `ENVIRONMENT_SETUP_COMPLETE.md` for full environment setup
=======
# 🚨 CRITICAL: Stripe Live Keys Setup Required

## Current Status
❌ **PAYMENT PROCESSING BLOCKED** - Placeholder Stripe keys detected
✅ Live publishable key configured
❌ Secret key and webhook secret still using placeholders

## Required Actions (Complete Immediately)

### 1. Get Your Actual Stripe Live Keys

**Step 1: Get Secret Key**
1. Go to https://dashboard.stripe.com/apikeys
2. Switch to **LIVE** mode (toggle in top-left)
3. Copy the "Secret key" (starts with `sk_live_`)
4. **NEVER share this key publicly**

**Step 2: Create Webhook Endpoint**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://mwvcbedvnimabfwubazz.functions.supabase.co/stripe-webhook-handler`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the "Signing secret" (starts with `whsec_`)

### 2. Update Environment Variables

**In .env.local.template (line 28-29):**
```bash
# Replace these placeholders:
STRIPE_SECRET_KEY=sk_live_[YOUR_ACTUAL_SECRET_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_ACTUAL_WEBHOOK_SECRET]
```

**In Vercel Dashboard:**
1. Go to your project settings
2. Environment Variables section
3. Update:
   - `STRIPE_SECRET_KEY` = your actual sk_live_ key
   - `STRIPE_WEBHOOK_SECRET` = your actual whsec_ key

**In Supabase Dashboard:**
1. Go to Project Settings > Secrets
2. Add/update:
   - `STRIPE_SECRET_KEY` = your actual sk_live_ key
   - `STRIPE_WEBHOOK_SECRET` = your actual whsec_ key

### 3. Deploy and Test

```bash
# Deploy changes
git add .
git commit -m "Configure live Stripe keys"
git push origin main

# Test payment flow
# Use real payment methods with small amounts ($0.50)
```

## Security Warning ⚠️

- **NEVER** commit actual Stripe keys to Git
- **ONLY** store them in secure environment variable systems
- **ALWAYS** use live keys for production, test keys for development

## Current Configuration Status

✅ **VITE_STRIPE_PUBLISHABLE_KEY**: `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`

❌ **STRIPE_SECRET_KEY**: `sk_live_your_secret_key_here` (PLACEHOLDER)

❌ **STRIPE_WEBHOOK_SECRET**: `whsec_your_webhook_secret_here` (PLACEHOLDER)

## Impact of Not Fixing

- ❌ All payment processing fails
- ❌ Customer transactions blocked  
- ❌ Revenue generation stopped
- ❌ Business operations halted

**This must be fixed immediately for the application to process payments.**
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
