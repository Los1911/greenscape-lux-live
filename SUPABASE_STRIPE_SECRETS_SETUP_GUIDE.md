# 🔐 SUPABASE STRIPE SECRETS SETUP GUIDE
*Complete Backend Configuration for Payment Processing*

## 🎯 OVERVIEW
This guide walks you through configuring the missing Stripe secret keys in Supabase to complete your payment system backend configuration.

## 🚨 CURRENT ISSUE
- **Problem**: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are not configured in Supabase
- **Impact**: Backend payment processing and webhooks fail
- **Status**: CRITICAL - Payment system backend broken

## 📋 PREREQUISITES
Before starting, ensure you have:
- Access to your Stripe Dashboard (https://dashboard.stripe.com)
- Access to your Supabase Dashboard
- Admin permissions for both platforms

## 🔑 STEP 1: GET STRIPE SECRET KEY

### 1.1 Access Stripe Dashboard
1. Go to: https://dashboard.stripe.com/apikeys
2. Sign in to your Stripe account
3. Ensure you're in **LIVE** mode (toggle in top left should say "Live")

### 1.2 Copy Secret Key
1. In the "Secret key" section, click "Reveal live key"
2. Copy the key (starts with `sk_live_`)
3. **IMPORTANT**: Keep this key secure - never share or commit to git

## 🪝 STEP 2: CREATE WEBHOOK ENDPOINT

### 2.1 Access Webhooks Section
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint" button

### 2.2 Configure Webhook
1. **Endpoint URL**: `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook`
2. **Description**: "GreenScape Lux Payment Webhooks"
3. **Events to send**: Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
   - `customer.updated`
4. Click "Add endpoint"

### 2.3 Get Webhook Secret
1. Click on your newly created webhook endpoint
2. In the "Signing secret" section, click "Reveal"
3. Copy the webhook secret (starts with `whsec_`)

## 🗄️ STEP 3: ADD SECRETS TO SUPABASE

### 3.1 Access Supabase Secrets
1. Go to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/settings/secrets
2. Sign in to your Supabase account
3. Navigate to your GreenScape Lux project

### 3.2 Add Stripe Secret Key
1. Click "Add new secret" button
2. **Name**: `STRIPE_SECRET_KEY`
3. **Value**: Paste your Stripe secret key (sk_live_...)
4. Click "Add secret"

### 3.3 Add Webhook Secret
1. Click "Add new secret" button again
2. **Name**: `STRIPE_WEBHOOK_SECRET`
3. **Value**: Paste your webhook secret (whsec_...)
4. Click "Add secret"

## 🧪 STEP 4: VERIFY CONFIGURATION

### 4.1 Check Edge Function Logs
1. Go to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/functions
2. Click on "stripe-webhook" function
3. Check logs for any authentication errors
4. Should see successful initialization messages

### 4.2 Test Webhook Endpoint
1. In Stripe Dashboard, go to your webhook endpoint
2. Click "Send test webhook"
3. Select `payment_intent.succeeded` event
4. Click "Send test webhook"
5. Check Supabase function logs for successful processing

## 🔍 VERIFICATION CHECKLIST

### ✅ Stripe Configuration:
- [ ] Accessed Stripe Dashboard in LIVE mode
- [ ] Copied secret key (starts with sk_live_)
- [ ] Created webhook endpoint with correct URL
- [ ] Selected required webhook events
- [ ] Copied webhook secret (starts with whsec_)

### ✅ Supabase Configuration:
- [ ] Added `STRIPE_SECRET_KEY` to Supabase secrets
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Supabase secrets
- [ ] Verified secrets are saved correctly
- [ ] Checked edge function logs for errors

### ✅ Testing:
- [ ] Sent test webhook from Stripe Dashboard
- [ ] Verified webhook processing in Supabase logs
- [ ] No authentication errors in function logs

## 🚨 TROUBLESHOOTING

### If Webhook Creation Fails:
- Verify the URL is exactly: `https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook`
- Check that your Supabase project is active
- Ensure you have admin permissions in Stripe

### If Secrets Don't Save:
- Verify you have admin access to the Supabase project
- Check that secret names are exactly: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- Ensure no extra spaces in the secret values

### If Webhook Tests Fail:
- Check Supabase function logs for specific error messages
- Verify the webhook secret was copied correctly
- Ensure the stripe-webhook function is deployed

## 📊 SUCCESS INDICATORS

### When Properly Configured:
- ✅ Supabase secrets dashboard shows both secrets added
- ✅ Stripe webhook endpoint shows "Active" status
- ✅ Test webhooks process successfully
- ✅ Edge function logs show no authentication errors
- ✅ Payment processing completes end-to-end

## 🚀 NEXT STEPS

After completing this configuration:

1. **Test Payment Flow**:
   - Add a payment method on your site
   - Process a test payment
   - Verify webhook processing

2. **Monitor Function Logs**:
   - Watch for any payment processing errors
   - Set up alerts for failed webhooks

3. **Update Documentation**:
   - Mark Stripe configuration as complete
   - Update deployment checklists

## 📞 SUPPORT

If you encounter issues:
1. Double-check all URLs and secret values are exactly correct
2. Verify you're using LIVE mode in Stripe (not test mode)
3. Check Supabase function deployment status
4. Review edge function logs for specific error messages

---

**⏰ ESTIMATED TIME**: 10-15 minutes
**🎯 PRIORITY**: CRITICAL - Complete after Vercel environment setup
**📋 DEPENDENCIES**: Requires Stripe account with live keys enabled