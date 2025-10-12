# Environment Configuration Emergency Fix

## Problem Diagnosis
The application is failing with critical environment validation errors because required environment variables are not properly configured in the production deployment.

## Immediate Solution

### 1. Create Local Environment File
Create `.env.local` in your project root with these exact values:

```bash
# Supabase Configuration (CRITICAL)
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY

# Stripe Configuration (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Google Maps Configuration (for location services)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4

# Email Configuration
VITE_RESEND_API_KEY=re_your_resend_api_key_here
```

### 2. Configure Production Environment Variables

#### For Vercel Deployment:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables for **Production, Preview, and Development**:

**Required Variables:**
- `VITE_SUPABASE_URL` = `https://mwvcbedvnimabfwubazz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY`

**Optional Variables:**
- `VITE_STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key
- `VITE_GOOGLE_MAPS_API_KEY` = Your Google Maps API key

### 3. Redeploy Application
After setting environment variables, trigger a new deployment to apply the changes.

## Quick Verification Commands

```bash
# Check if environment variables are accessible
npm run dev
# Then check browser console for environment validation logs

# Or run the Stripe configuration checker
npm run check-stripe
```

## Expected Results
After fixing the configuration, you should see:
- ✅ VITE_SUPABASE_URL: Set
- ✅ VITE_SUPABASE_ANON_KEY: Set
- ✅ Application loads without critical environment errors

## If Issues Persist

### Clear Cache and Redeploy
```bash
# Clear all caches and force redeploy
npm run build
# Or use the nuclear deployment script
./scripts/nuclear-deploy.sh
```

### Check Environment Variable Names
Ensure variable names are exactly:
- `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)

The `VITE_` prefix is required for Vite to include them in the build.