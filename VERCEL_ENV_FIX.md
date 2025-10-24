# Vercel Environment Variables Fix

## Problem
The app is showing: `[ENV ERROR] Missing VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY`

## Solution
Add these environment variables in your Vercel dashboard:

### Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these exact variables:

**VITE_SUPABASE_URL**
```
https://mwvcbedvnimabfwubazz.supabase.co
```

**VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
```

**VITE_ADMIN_EMAIL**
```
cmatthews@greenscapelux.com
```

## Important Notes
1. Make sure to set these for **Production**, **Preview**, and **Development** environments
2. After adding, redeploy your app
3. The VITE_ prefix is required for Vite to inject these at build time

## Local Development
A `.env.local` file has been created with these values for local development.