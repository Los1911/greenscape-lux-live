# How to Enable Stripe Connect - Step-by-Step Guide

## Overview
If you're seeing "Failed to create Connect account" errors, it's likely because Stripe Connect is not enabled in your Stripe Dashboard. This guide will walk you through enabling it.

---

## Step-by-Step Instructions

### Step 1: Log into Stripe Dashboard
1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Log in with your Stripe account credentials
3. **Important**: Make sure you're in the correct mode (Test or Live) in the top-right corner
   - For development: Use **Test mode**
   - For production: Use **Live mode**

---

### Step 2: Navigate to Connect Settings
1. Click on **"Settings"** in the left sidebar (gear icon)
2. Scroll down and click on **"Connect"** under the "Product settings" section
3. If you don't see "Connect", look for **"More products"** or **"Product settings"**

**Screenshot location**: Settings → Connect

---

### Step 3: Enable Stripe Connect
1. You'll see a page titled **"Connect settings"** or **"Get started with Connect"**
2. Click the **"Get Started"** button (blue button)
3. If already enabled, you'll see Connect settings instead

---

### Step 4: Complete Connect Setup Form
Fill out the required information:

#### Business Information
- **Platform name**: Your business name (e.g., "GreenScape Lux")
- **Platform description**: Brief description of your platform
- **Platform website**: Your website URL
- **Support email**: Your support email address
- **Support phone**: Your support phone number (optional)

#### Connect Settings
- **Account type**: Choose **"Standard"** (recommended for most platforms)
  - Standard: Connected accounts have their own Stripe Dashboard
  - Express: Simplified onboarding, you manage more
  - Custom: Full control, most complex
- **Branding**: Upload your logo (optional but recommended)

#### Capabilities
Enable the capabilities you need:
- ✅ **Card payments** (required)
- ✅ **Transfers** (required for payouts)
- ✅ **US bank account payments** (optional)

---

### Step 5: Configure Connect Settings
After initial setup, configure these important settings:

#### OAuth Settings (if using OAuth flow)
1. Go to Settings → Connect → OAuth settings
2. Add your redirect URI: `https://yourdomain.com/stripe/callback`
3. Save changes

#### Webhook Settings
1. Go to Settings → Connect → Webhooks
2. Add endpoint: `https://your-supabase-url.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `account.updated`
   - `account.application.authorized`
   - `account.application.deauthorized`
   - `capability.updated`

---

### Step 6: Verify Settings Are Saved
1. Return to Settings → Connect
2. You should see:
   - ✅ "Connect is enabled"
   - Your platform name and details
   - Connect settings configured
3. Copy your **Connect platform ID** (starts with `ca_`)
4. Note: This is different from your regular Stripe API keys

---

## Troubleshooting

### Issue: "Connect" Option Not Visible

**Solution 1: Check Account Eligibility**
- Stripe Connect may not be available in all countries
- Verify your account country supports Connect: [Stripe Connect availability](https://stripe.com/global)
- Your account must be fully activated (not restricted)

**Solution 2: Account Verification Required**
- Complete your Stripe account verification first
- Go to Settings → Account details
- Complete all required business information
- Submit any requested documents

**Solution 3: Contact Stripe Support**
- If Connect is not visible after verification, contact Stripe
- Go to: [https://support.stripe.com/contact](https://support.stripe.com/contact)
- Ask to enable Stripe Connect for your account
- Mention your platform use case

---

### Issue: "Connect Setup Failed" or Errors During Setup

**Check 1: Browser Issues**
- Clear browser cache and cookies
- Try a different browser (Chrome recommended)
- Disable browser extensions temporarily

**Check 2: Account Status**
- Ensure your Stripe account is in good standing
- Check for any account restrictions or holds
- Verify email address is confirmed

**Check 3: Required Information**
- All required fields must be filled out
- Business information must be accurate
- Support contact must be valid

---

### Issue: Connect Enabled But Still Getting Errors

**Verify API Keys**
1. Go to Developers → API keys
2. Make sure you're using the correct keys:
   - **Publishable key**: Starts with `pk_test_` or `pk_live_`
   - **Secret key**: Starts with `sk_test_` or `sk_live_`
3. Keys must match the mode (Test/Live)

**Check Environment Variables**
```bash
# In your .env file or Vercel/Supabase settings:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # Backend only
```

**Run Diagnostic Tool**
1. Go to Admin Dashboard → Connect Test tab
2. Click "Run Diagnostic"
3. Review all status indicators
4. Follow any error hints provided

---

## After Enabling Connect

### Update Your Application
1. Restart your development server
2. Clear application cache
3. Test the diagnostic tool again
4. Try creating a Connect account

### Test Connect Onboarding
1. Go to Landscaper Dashboard
2. Click "Complete Stripe Onboarding"
3. You should be redirected to Stripe Connect onboarding
4. Complete the test onboarding flow
5. Verify account appears in Stripe Dashboard → Connect → Accounts

---

## Important Notes

### Test Mode vs Live Mode
- **Always test in Test mode first**
- Connect must be enabled in BOTH Test and Live modes separately
- Use test API keys for development
- Switch to live keys only when ready for production

### Account Types Explained
- **Standard**: Best for most platforms. Connected accounts get full Stripe Dashboard access
- **Express**: Simplified for faster onboarding. You handle more of the UI
- **Custom**: Complete control. You build entire payment experience

### Security Best Practices
- Never expose secret keys in frontend code
- Use environment variables for all API keys
- Rotate keys if compromised
- Enable webhook signature verification

---

## Need More Help?

### Resources
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Connect Onboarding Guide](https://stripe.com/docs/connect/onboarding)
- [Connect Account Types](https://stripe.com/docs/connect/accounts)

### Support Channels
- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Stripe Discord**: [https://stripe.com/discord](https://stripe.com/discord)
- **Documentation**: [https://stripe.com/docs](https://stripe.com/docs)

### Common Questions
**Q: How long does Connect approval take?**
A: Connect is usually enabled immediately for eligible accounts. If verification is needed, it can take 1-3 business days.

**Q: Does Connect cost extra?**
A: Stripe Connect has the same pricing as regular Stripe, plus platform fees you can optionally charge.

**Q: Can I use Connect with existing Stripe account?**
A: Yes! Connect works with your existing Stripe account. Just enable it in settings.

**Q: What if my country doesn't support Connect?**
A: Check [Stripe's global availability](https://stripe.com/global). If not available, consider alternative payment platforms or contact Stripe about expansion plans.

---

## Quick Checklist

Before you start:
- [ ] Stripe account is fully activated
- [ ] Email address is verified
- [ ] Business information is complete
- [ ] Account is in good standing

After enabling Connect:
- [ ] Connect shows as "Enabled" in dashboard
- [ ] Platform name and details are saved
- [ ] Webhook endpoints are configured
- [ ] API keys are correct in environment variables
- [ ] Diagnostic tool shows all green checkmarks
- [ ] Test account creation works

---

**Last Updated**: January 2025  
**Version**: 1.0
