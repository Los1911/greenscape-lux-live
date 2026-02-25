# ✅ Stripe Webhook Setup Complete - GreenScape Lux

## 🎯 What Was Configured

### 1. Webhook Handler Updated ✅
**File:** `supabase/functions/stripe-webhook/index.ts`

**Events Now Handled:**
- ✅ `payment_intent.succeeded` → Updates payment to 'completed'
- ✅ `payment_intent.payment_failed` → Updates payment to 'failed'
- ✅ `charge.refunded` → Updates payment to 'refunded' (NEW)

### 2. Testing Scripts Created ✅
- `scripts/verify-stripe-webhook.sh` - Bash verification script
- `scripts/stripe-webhook-test.js` - Node.js test suite

### 3. Documentation Created ✅
- `STRIPE_WEBHOOK_PRODUCTION_CONFIG.md` - Complete setup guide

---

## 🚀 Quick Setup Instructions

### Step 1: Configure Webhook in Stripe Dashboard (2 minutes)

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"+ Add endpoint"**
3. Enter URL: `https://greenscapelux.com/api/stripe/webhook`
4. Select events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 2: Add Secret to Supabase (1 minute)

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

**Or via Dashboard:**
1. Go to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/settings/vault
2. Click **"New secret"**
3. Name: `STRIPE_WEBHOOK_SECRET`
4. Value: `whsec_xxxxxxxxxxxxxxxxxxxxx`
5. Click **"Save"**

### Step 3: Redeploy Webhook Function (1 minute)

```bash
supabase functions deploy stripe-webhook
```

---

## ✅ Verification Checklist

Run verification script:
```bash
chmod +x scripts/verify-stripe-webhook.sh
./scripts/verify-stripe-webhook.sh
```

Or run test suite:
```bash
node scripts/stripe-webhook-test.js
```

### Manual Verification Steps

1. **Test from Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click your webhook endpoint
   - Click **"Send test webhook"**
   - Select `payment_intent.succeeded`
   - Verify response: `{"received": true}`

2. **Check Supabase Logs**
   ```bash
   supabase functions logs stripe-webhook --tail 20
   ```
   
   Expected output:
   ```
   🔔 Verified Event: payment_intent.succeeded
   ✅ Payment updated successfully
   ```

3. **Test Payment Flow**
   - Go to: https://greenscapelux.com
   - Submit a quote request
   - Process payment
   - Verify event appears in Stripe Dashboard → Events

4. **Check Browser Console**
   - Open DevTools → Console
   - Look for: `✅ Stripe connected successfully`
   - Verify: `VITE_STRIPE_PUBLIC_KEY: pk_live_51S1Ht0K6kWkUsx...`

---

## 📊 Webhook Event Flow

```
1. Customer makes payment on greenscapelux.com
   ↓
2. Stripe processes payment
   ↓
3. Stripe sends webhook event to:
   https://greenscapelux.com/api/stripe/webhook
   ↓
4. Supabase Edge Function receives event
   ↓
5. Event is logged to webhook_logs table
   ↓
6. Handler function processes event:
   - payment_intent.succeeded → Update payment status
   - payment_intent.payment_failed → Mark as failed
   - charge.refunded → Mark as refunded
   ↓
7. Database updated
   ↓
8. Response sent to Stripe: {"received": true}
```

---

## 🔍 Troubleshooting

### Issue: Webhook not receiving events

**Solution 1:** Verify URL is correct
```bash
curl -X POST https://greenscapelux.com/api/stripe/webhook
```

**Solution 2:** Check Supabase secret
```bash
supabase secrets list | grep STRIPE_WEBHOOK_SECRET
```

**Solution 3:** Redeploy edge function
```bash
supabase functions deploy stripe-webhook
```

### Issue: "Webhook signature verification failed"

**Cause:** Wrong webhook secret  
**Fix:** Copy correct secret from Stripe dashboard and update Supabase

### Issue: Events not appearing in database

**Cause:** Database permissions or table missing  
**Fix:** Check `webhook_logs` table exists and has proper RLS policies

---

## 📝 Environment Variables Summary

### ✅ Configured in Supabase Secrets (Edge Functions)
- `STRIPE_SECRET_KEY` = `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...` ← **ADD THIS**
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...`

### ✅ Configured in Vercel (Frontend)
- `VITE_STRIPE_PUBLIC_KEY` = `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`

---

## 🎉 Success Indicators

When everything is working correctly, you should see:

✅ Webhook endpoint returns 200 OK in Stripe Dashboard  
✅ Events appear in Stripe Dashboard → Events  
✅ Supabase logs show "🔔 Verified Event: ..."  
✅ Browser console shows "✅ Stripe connected successfully"  
✅ Payment status updates in database  
✅ No errors in Supabase Edge Function logs  

---

## 📚 Related Documentation

- [STRIPE_WEBHOOK_PRODUCTION_CONFIG.md](./STRIPE_WEBHOOK_PRODUCTION_CONFIG.md) - Detailed setup guide
- [PAYMENT_SYSTEM_IMPLEMENTATION.md](./PAYMENT_SYSTEM_IMPLEMENTATION.md) - Payment system overview
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)

---

## 🚀 Ready to Deploy!

Your webhook system is now configured and ready for production. Follow the 3-step setup above to complete the configuration.

**Estimated Time:** 5 minutes  
**Difficulty:** Easy  
**Status:** ✅ Code Complete - Awaiting Configuration
