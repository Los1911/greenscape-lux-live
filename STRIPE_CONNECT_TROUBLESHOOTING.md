# Stripe Connect Troubleshooting Guide

## Issue: "Failed to create Connect account" Error

### Possible Causes

#### 1. **Stripe Connect Not Enabled in Dashboard**
Stripe Connect must be enabled in your Stripe account before you can create Express accounts.

**Solution:**
1. Go to https://dashboard.stripe.com/settings/connect
2. Click "Get Started" if Connect is not enabled
3. Complete the Connect platform setup
4. Accept Stripe's Connect Platform Agreement

#### 2. **Using Test Mode Keys Without Connect Setup**
Even in test mode, Connect needs to be enabled.

**Solution:**
1. Go to https://dashboard.stripe.com/test/connect/accounts/overview
2. Verify you can see the Connect dashboard
3. If not, enable Connect in Settings

#### 3. **Missing or Invalid API Keys**
The STRIPE_SECRET_KEY environment variable must be set correctly.

**Solution:**
```bash
# Check if secret is set
supabase secrets list

# Set the secret (use your actual key)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
# or for production
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

#### 4. **Restricted API Key**
If using a restricted key, it must have Connect permissions.

**Solution:**
1. Go to https://dashboard.stripe.com/apikeys
2. Create a new restricted key with these permissions:
   - Accounts: Write
   - Account Links: Write
3. Use this key instead

### Testing the Fix

Run this diagnostic function to check configuration:

```bash
# Deploy diagnostic function
supabase functions deploy validate-stripe-connect
```

Then test in browser console:
```javascript
const { data, error } = await supabase.functions.invoke('validate-stripe-connect');
console.log(data);
```

### Expected Response

**Success:**
```json
{
  "connectEnabled": true,
  "apiKeyValid": true,
  "canCreateAccounts": true
}
```

**Failure:**
```json
{
  "error": "Connect not enabled",
  "details": "..."
}
```

## Step-by-Step Fix

### 1. Enable Stripe Connect
```
1. Visit: https://dashboard.stripe.com/settings/connect
2. Click "Get Started with Connect"
3. Select "Platform or Marketplace"
4. Complete the form
5. Accept the agreement
```

### 2. Verify Environment Variables
```bash
# List all secrets
supabase secrets list

# Should see:
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLISHABLE_KEY
# - STRIPE_WEBHOOK_SECRET
```

### 3. Test Account Creation
```bash
# Use Stripe CLI to test
stripe accounts create --type=express --email=test@example.com
```

### 4. Check Function Logs
```bash
# View real-time logs
supabase functions logs create-stripe-connect-account --tail
```

## Common Error Messages

### "Connect is not enabled"
- Enable Connect in Stripe Dashboard
- Wait 5 minutes for changes to propagate

### "Invalid API key"
- Check STRIPE_SECRET_KEY is correct
- Verify key starts with `sk_test_` or `sk_live_`
- Ensure no extra spaces or quotes

### "Insufficient permissions"
- Use full API key (not restricted)
- Or add Connect permissions to restricted key

## Still Not Working?

1. Check Stripe Dashboard for any account issues
2. Verify email domain is not blocked
3. Try with a different email address
4. Contact Stripe support if account has restrictions
