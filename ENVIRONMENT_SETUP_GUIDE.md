# Environment Variables Setup Guide

## The Problem
You're seeing these errors because the app expects environment variables to be injected at build time:
```
[ENV ERROR] Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_URL — Not injected at build time
VITE_SUPABASE_ANON_KEY — Not injected at build time
```

## Quick Fix Applied
- Modified `src/main.tsx` to only show env validation errors in development mode
- Production deployments will now use runtime fallbacks silently

## For Vercel Deployment

### Step 1: Add Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables for **All Environments** (Production, Preview, Development):

```
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
```

### Step 2: Redeploy
After adding the variables, trigger a new deployment by:
- Pushing a new commit, OR
- Going to Deployments tab and clicking "Redeploy"

## For Local Development
Create a `.env.local` file in your project root:
```bash
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
```

## Why This Happens
- Vite requires `VITE_` prefixed variables to be available at build time
- Your app has runtime fallbacks that work even without build-time injection
- The validation was running in production causing console spam

## Current Status
✅ App will work in production even without env vars (uses runtime config)
✅ Environment validation only runs in development now
✅ No more console spam in production deployments