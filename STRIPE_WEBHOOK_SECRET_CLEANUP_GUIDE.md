# Stripe Webhook Secret Cleanup Guide

## Project: mwvcbedvnimabfwubazz
## New Secret: whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o

---

## Current Situation Analysis

Your Supabase project may have the STRIPE_WEBHOOK_SECRET stored in multiple locations:
1. **Edge Function Secrets** (correct location)
2. **Project Environment Variables** (legacy/incorrect location)

## Cleanup Steps

### Step 1: Verify Current Secret Location

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/mwvcbedvnimabfwubazz
2. Navigate to **Settings** → **Edge Functions**
3. Check if `STRIPE_WEBHOOK_SECRET` exists here (this is CORRECT)
4. Navigate to **Settings** → **API** → **Environment Variables**
5. Check if `STRIPE_WEBHOOK_SECRET` exists here (this should be REMOVED)

### Step 2: Remove Old Environment Variable (If Exists)

**Via Supabase Dashboard:**
1. Go to **Settings** → **API** → **Environment Variables**
2. Find `STRIPE_WEBHOOK_SECRET` in the list
3. Click the **Delete** or **Remove** button
4. Confirm deletion

**Via Supabase CLI:**
```bash
# This removes project-level env vars (not Edge Function secrets)
supabase secrets unset STRIPE_WEBHOOK_SECRET --project-ref mwvcbedvnimabfwubazz
```

### Step 3: Ensure Edge Function Secret is Set

**Via Supabase Dashboard:**
1. Go to **Settings** → **Edge Functions**
2. Find or add `STRIPE_WEBHOOK_SECRET`
3. Set value to: `whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o`
4. Click **Save**

**Via Supabase CLI:**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o --project-ref mwvcbedvnimabfwubazz
```

---

## Confirmation: Function Will Continue Working

### Why No Redeployment Needed:

Your `stripe-webhook` function reads secrets using:
```typescript
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
```

**Edge Functions automatically access secrets from the Edge Function Secrets store:**
- Secrets are injected at runtime
- No code changes required
- No redeployment required
- Changes take effect immediately

### Verification Steps:

1. **Check Function Logs:**
   - Dashboard → Edge Functions → stripe-webhook → Logs
   - Look for successful webhook validations
   - No ConfigValidationError messages

2. **Test Webhook:**
   - Send a test webhook from Stripe Dashboard
   - Should validate successfully with signature verification
   - Check response status (200 = success)

3. **Stripe Dashboard Check:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Find your webhook endpoint
   - Click "Send test webhook"
   - Should show successful delivery

---

## Important Notes

### Edge Function Secrets vs Environment Variables:

| Location | Purpose | Used By |
|----------|---------|---------|
| **Edge Function Secrets** | Runtime secrets for Edge Functions | ✅ stripe-webhook function |
| **Environment Variables** | Database connection strings, API URLs | ❌ Not for Edge Functions |

### Security Best Practices:

✅ **DO:**
- Store webhook secrets in Edge Function Secrets
- Rotate secrets periodically
- Use different secrets for test/production

❌ **DON'T:**
- Store secrets in environment variables
- Commit secrets to git
- Reuse secrets across environments

---

## Troubleshooting

### If Webhook Validation Fails:

1. **Check Secret Format:**
   - Must start with `whsec_`
   - No extra spaces or quotes
   - Exact match with Stripe Dashboard

2. **Verify Stripe Webhook Configuration:**
   - Endpoint URL matches deployed function
   - Webhook secret matches Supabase secret
   - Webhook is enabled in Stripe

3. **Check Function Logs:**
   ```bash
   supabase functions logs stripe-webhook --project-ref mwvcbedvnimabfwubazz
   ```

### Common Issues:

- **401 Unauthorized**: Secret mismatch
- **500 Error**: Secret not set or validation error
- **Signature Verification Failed**: Wrong secret or corrupted payload

---

## Summary

✅ **Your stripe-webhook function WILL continue working** after cleanup because:
1. Edge Functions read from Edge Function Secrets (not env vars)
2. Secrets are injected at runtime (no redeployment needed)
3. Function code already uses `Deno.env.get()` correctly

✅ **After cleanup, you'll have:**
- Single source of truth for webhook secret
- Cleaner configuration
- Better security posture

🔒 **New Secret:** whsec_rD6sorHSdQtfe50Lukotr3zwlK4faY7o
📍 **Location:** Edge Function Secrets only
🚀 **Status:** Ready to use immediately
