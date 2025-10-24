# Stripe Live Keys Migration Guide

## ✅ COMPLETED: Live Publishable Key Update
The Stripe live publishable key has been successfully updated:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK
```

## 🚨 CRITICAL: Remaining Steps Required

### 1. Obtain Stripe Secret Key
- Go to https://dashboard.stripe.com/apikeys
- Copy the live secret key (starts with `sk_live_`)
- Update `STRIPE_SECRET_KEY` in all environments

### 2. Configure Webhook Secret
- Go to https://dashboard.stripe.com/webhooks
- Create/update webhook endpoint for your domain
- Copy the webhook signing secret (starts with `whsec_`)
- Update `STRIPE_WEBHOOK_SECRET` in all environments

### 3. Deploy to All Platforms

#### Vercel Deployment:
```bash
# Set environment variables in Vercel dashboard or CLI
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
```

#### Netlify Deployment:
```bash
# Set in Netlify dashboard: Site settings > Environment variables
# Or use Netlify CLI
netlify env:set VITE_STRIPE_PUBLISHABLE_KEY "pk_live_..."
netlify env:set STRIPE_SECRET_KEY "sk_live_..."
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_..."
```

### 4. Update Supabase Edge Functions
Ensure all Supabase edge functions use the live secret key:
```sql
-- Update in Supabase dashboard > Project Settings > Secrets
STRIPE_SECRET_KEY = sk_live_your_actual_secret_key
```

### 5. Test Payment Flow
- Test with real payment methods (small amounts)
- Verify webhook delivery
- Check payment confirmation emails
- Validate payout processing

## 🔄 Automated Sync Integration
The automated environment sync system will propagate these changes:
- Run: `npm run env:sync` to sync across platforms
- Monitor: Check EnvironmentSyncDashboard for status
- Verify: All platforms show matching live keys

## 🔐 Security Checklist
- [ ] Live keys stored securely in platform dashboards
- [ ] Test keys removed from production
- [ ] Webhook endpoints use HTTPS
- [ ] Environment variables validated
- [ ] Payment flow tested end-to-end

## 📞 Support
If issues arise during migration:
1. Check Stripe dashboard logs
2. Verify webhook endpoint configuration
3. Test with Stripe CLI for debugging
4. Review automated sync logs

**Status: Live publishable key configured ✅**
**Next: Configure secret key and webhook secret**