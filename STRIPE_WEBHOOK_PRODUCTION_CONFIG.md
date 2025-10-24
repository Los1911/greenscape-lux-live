# 🎯 Stripe Webhook Production Configuration Guide

## Overview
Configure Stripe webhooks for GreenScape Lux production environment to handle payment events in real-time.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Configure Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Navigate to: https://dashboard.stripe.com/webhooks
   - Click **"+ Add endpoint"**

2. **Add Endpoint URL**
   ```
   https://greenscapelux.com/api/stripe/webhook
   ```
   
   **Alternative (Direct Supabase):**
   ```
   https://mwvcbedvnimabfwubazz.supabase.co/functions/v1/stripe-webhook
   ```

3. **Select Events to Listen For**
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`

4. **Copy Webhook Signing Secret**
   - After creating the endpoint, copy the **Signing secret**
   - Format: `whsec_xxxxxxxxxxxxxxxxxxxxx`

---

### Step 2: Add Secret to Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz/settings/vault

2. **Add New Secret**
   - Click **"New secret"**
   - Name: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_xxxxxxxxxxxxxxxxxxxxx` (paste from Stripe)
   - Click **"Save"**

---

### Step 3: Redeploy Application

**Option A: Supabase CLI**
```bash
supabase functions deploy stripe-webhook
```

**Option B: Automatic Deployment**
- Push to main branch (GitHub Actions will deploy)

---

## ✅ Verification Steps

### 1. Test Webhook from Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `payment_intent.succeeded`
5. Click **"Send test webhook"**

**Expected Result:**
- Status: ✅ 200 OK
- Response: `{"received": true}`

### 2. Check Supabase Logs

```bash
supabase functions logs stripe-webhook --tail 20
```

**Expected Output:**
```
🔔 Verified Event: payment_intent.succeeded
✅ Payment updated successfully
```

### 3. Verify in Browser Console

1. Go to: https://greenscapelux.com
2. Open DevTools → Console
3. Look for:
   ```
   ✅ Stripe connected successfully
   VITE_STRIPE_PUBLIC_KEY: pk_live_51S1Ht0K6kWkUsx...
   ```

---

## 🧪 Test Payment Flow

### Make a Test Payment

1. **Go to GreenScape Lux**
   - Navigate to: https://greenscapelux.com

2. **Submit Quote Request**
   - Fill out quote form
   - Submit request

3. **Process Payment**
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

4. **Verify Event in Stripe**
   - Go to: https://dashboard.stripe.com/events
   - Look for `payment_intent.succeeded` event
   - Status should be: ✅ Succeeded

---

## 📊 Webhook Event Handlers

### Implemented Events

| Event | Handler | Action |
|-------|---------|--------|
| `payment_intent.succeeded` | `handlePaymentSuccess()` | Updates payment status to 'completed' |
| `payment_intent.payment_failed` | `handlePaymentFailure()` | Updates payment status to 'failed' |
| `charge.refunded` | `handleChargeRefunded()` | Updates payment status to 'refunded' |

---

## 🔍 Troubleshooting

### Webhook Not Receiving Events

**Check 1: Verify URL is correct**
```bash
curl https://greenscapelux.com/api/stripe/webhook
```

**Check 2: Verify secret is set**
```bash
supabase secrets list | grep STRIPE_WEBHOOK_SECRET
```

**Check 3: Check Supabase logs**
```bash
supabase functions logs stripe-webhook --tail 50
```

### Common Issues

**Issue: "Missing Stripe signature"**
- **Cause:** Webhook secret not configured
- **Fix:** Add `STRIPE_WEBHOOK_SECRET` to Supabase secrets

**Issue: "Webhook signature verification failed"**
- **Cause:** Wrong webhook secret
- **Fix:** Copy correct secret from Stripe dashboard

**Issue: "Function returned null"**
- **Cause:** Edge function not deployed
- **Fix:** Run `supabase functions deploy stripe-webhook`

---

## 📝 Environment Variables Checklist

### Supabase Secrets (Edge Functions)
- ✅ `STRIPE_SECRET_KEY` = `sk_live_...`
- ✅ `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...`

### Vercel Environment Variables (Frontend)
- ✅ `VITE_STRIPE_PUBLIC_KEY` = `pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK`

---

## 🎉 Success Indicators

✅ Webhook endpoint created in Stripe  
✅ Webhook secret added to Supabase  
✅ Edge function deployed  
✅ Test webhook returns 200 OK  
✅ Events appear in Stripe dashboard  
✅ Console shows "✅ Stripe connected successfully"  
✅ Payment flow works end-to-end  

---

## 📚 Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [GreenScape Lux Payment System](./PAYMENT_SYSTEM_IMPLEMENTATION.md)
