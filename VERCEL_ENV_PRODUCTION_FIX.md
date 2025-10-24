# Vercel Production Environment Fix

## Issue
Environment variables are undefined in production build, even though they work locally.

## Root Cause Analysis
1. **Local Development**: `.env.local` file loads correctly with Vite
2. **Production Build**: Vercel needs environment variables set in dashboard
3. **Build Time vs Runtime**: Vite injects env vars at build time, not runtime

## Immediate Fix Steps

### 1. Set Vercel Environment Variables
```bash
# Via Vercel CLI
vercel env add VITE_SUPABASE_URL production
# Enter: https://mwvcbedvnimabfwubazz.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
```

### 2. Vercel Dashboard Method
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables for **Production**:
   - `VITE_SUPABASE_URL` = `https://mwvcbedvnimabfwubazz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY`

### 3. Force Rebuild
```bash
# Trigger new deployment with environment variables
vercel --prod
```

## Verification Steps

### Local Development
```bash
# Run the environment checker
node scripts/env-runtime-check.js

# Start dev server and check console
npm run dev
# Look for "✅ Environment validation passed" in console
```

### Production Verification
1. Deploy to Vercel with environment variables set
2. Open browser developer tools on production site
3. Check console for environment validation messages
4. Verify no "undefined" errors for Supabase connection

## Common Issues & Solutions

### Issue: Variables still undefined after setting in Vercel
**Solution**: Ensure variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (case-sensitive)

### Issue: Build fails with environment errors
**Solution**: Set variables for all environments (Development, Preview, Production)

### Issue: Local works but production doesn't
**Solution**: Check that Vercel environment variables match your `.env.local` exactly

## Testing Commands
```bash
# Test local environment
npm run dev

# Test build process
npm run build
npm run preview

# Check environment variables
node scripts/env-runtime-check.js
```

## Emergency Fallback
The app includes fallback configuration in `src/lib/config.ts` that will use hardcoded values if environment variables are missing. This ensures the app doesn't break completely.

## Next Steps
1. Set environment variables in Vercel dashboard
2. Trigger new deployment
3. Verify production site loads without console errors
4. Test core functionality (auth, data loading)