# 🔐 Supabase Secrets Setup (Server-Side Only)

## Quick Setup for Supabase Dashboard

Go to: **Supabase Dashboard** → **mwvcbedvnimabfwubazz** → **Project Settings** → **Edge Functions** → **Secrets**

---

## ✅ Add These Secrets Now

### 1. Resend API Key (Email Service)

```
Name: RESEND_API_KEY
Value: re_dTWTSNo5_L2o9dFGw2mwyy8VFvvXxTC6A
```

**Purpose:** Server-side email sending via Supabase Edge Functions

---

## ⏳ Add These Secrets Later (When You Have Stripe Keys)

### 2. Stripe Secret Key

```
Name: STRIPE_SECRET_KEY
Value: sk_live_[YOUR_STRIPE_SECRET_KEY]
```

**How to get:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Reveal and copy your **Secret key** (starts with `sk_live_`)
3. Add to Supabase Secrets

**⚠️ CRITICAL:** This key must NEVER be added to Vercel or exposed to the client!

---

### 3. Stripe Webhook Secret

```
Name: STRIPE_WEBHOOK_SECRET
Value: whsec_[YOUR_WEBHOOK_SECRET]
```

**How to get:**
1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://mwvcbedvnimabfwubazz.functions.supabase.co/stripe-webhook`
4. Select events to listen to (or select "Select all events")
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to Supabase Secrets

---

## 📋 Verification Checklist

- [ ] `RESEND_API_KEY` added to Supabase Secrets
- [ ] `STRIPE_SECRET_KEY` added (when obtained from Stripe)
- [ ] `STRIPE_WEBHOOK_SECRET` added (after creating webhook endpoint)
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Test webhook delivery in Stripe Dashboard

---

## 🧪 Testing Server-Side Secrets

After adding secrets, test them:

1. **Test Resend Email:**
   - Trigger a quote request or signup
   - Check if email is sent successfully
   - View logs in Supabase Edge Functions

2. **Test Stripe Integration:**
   - Process a test payment
   - Check Stripe Dashboard for transaction
   - Verify webhook events are received

---

## 🔒 Security Notes

**Why Supabase Secrets?**
- Server-side only (never exposed to browser)
- Encrypted at rest
- Only accessible by Edge Functions
- Cannot be viewed in client-side code

**What NOT to do:**
- ❌ Don't add `VITE_STRIPE_SECRET_KEY` to Vercel
- ❌ Don't commit secrets to GitHub
- ❌ Don't expose secrets in client-side code

---

## 🆘 Troubleshooting

**Secrets not working?**
- Redeploy Edge Functions after adding secrets
- Check secret names match exactly (case-sensitive)
- View Edge Function logs for error messages

**Stripe webhook not receiving events?**
- Verify webhook URL is correct
- Check webhook signing secret matches
- Test webhook in Stripe Dashboard
- Check Edge Function logs for errors

---

## 📚 Additional Resources

- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe API Keys](https://stripe.com/docs/keys)
- See `STRIPE_KEYS_SETUP_INSTRUCTIONS.md` for detailed Stripe setup
