# Vercel Environment Variables Setup

## Add Environment Variables via Vercel CLI

Run these commands in your project directory:

```bash
# Required Supabase Configuration
vercel env add VITE_SUPABASE_URL
# When prompted, enter: https://mwvcbedvnimabfwubazz.supabase.co
# Select: Production, Preview, Development (all environments)

vercel env add VITE_SUPABASE_ANON_KEY
# When prompted, enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
# Select: Production, Preview, Development (all environments)

vercel env add VITE_SUPABASE_FUNCTIONS_URL
# When prompted, enter: https://mwvcbedvnimabfwubazz.functions.supabase.co
# Select: Production, Preview, Development (all environments)

vercel env add VITE_SITE_URL
# When prompted, enter: https://greenscapelux.com
# Select: Production, Preview, Development (all environments)

vercel env add VITE_ADMIN_EMAIL
# When prompted, enter: cmatthews@greenscapelux.com
# Select: Production, Preview, Development (all environments)

vercel env add VITE_APP_ENV
# When prompted, enter: production
# Select: Production, Preview only
```

## Verify Environment Variables

```bash
# List all environment variables
vercel env ls

# Pull environment variables to local .env file
vercel env pull .env.local
```

## Redeploy After Adding Variables

```bash
# Deploy to production
vercel --prod

# Or trigger new deployment
git push origin main
```

## Alternative: Vercel Dashboard Method

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://mwvcbedvnimabfwubazz.supabase.co`
   - Environments: Production, Preview, Development

Repeat for all variables listed above.

## Troubleshooting

### Variables still undefined?
1. **Check variable names** - Must start with `VITE_`
2. **Restart dev server** after adding .env.local
3. **Redeploy** after adding Vercel env vars
4. **Clear cache** - Browser and Vercel edge cache

### Debug commands:
```bash
# Check local environment
node scripts/env-debug.js

# Check Vercel environment
vercel env ls

# Test deployment
vercel --prod
```