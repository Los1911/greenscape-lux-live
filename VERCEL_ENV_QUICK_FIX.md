# VERCEL ENVIRONMENT VARIABLES - QUICK FIX

## IMMEDIATE ACTION REQUIRED

The build is failing because Vercel is not injecting the required environment variables at build time.

### 1. Add Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard → Settings → Environment Variables and add:

**Variable Name:** `VITE_SUPABASE_URL`
**Value:** `https://mwvcbedvnimabfwubazz.supabase.co`
**Environment:** All (Production, Preview, Development)

**Variable Name:** `VITE_SUPABASE_ANON_KEY`
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY`
**Environment:** All (Production, Preview, Development)

### 2. Redeploy

After adding the environment variables, trigger a new deployment by:
- Pushing a commit to your repository, OR
- Going to Deployments tab and clicking "Redeploy" on the latest deployment

### 3. Verify Fix

The application should now build successfully without the environment variable errors.

## Alternative: Use Runtime Configuration

The app has a fallback system that uses localStorage or URL parameters if environment variables fail. This is already implemented in `src/lib/runtimeConfig.ts`.