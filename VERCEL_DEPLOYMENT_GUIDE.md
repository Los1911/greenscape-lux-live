# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### 1. Go to Vercel Dashboard
- Navigate to your project
- Go to Settings → Environment Variables

### 2. Add These Variables

**VITE_SUPABASE_URL**
```
https://mwvcbedvnimabfwubazz.supabase.co
```

**VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
```

### 3. Set Environment
- Select "Production" for production deployments
- Select "Preview" if you want them in preview deployments too

### 4. Redeploy
- After adding variables, trigger a new deployment
- The app will now use proper environment variables instead of fallbacks

## Verification
After deployment, visit `/reset-password` and check the browser console. You should see:
- ✅ VITE_SUPABASE_URL: (set)
- ✅ VITE_SUPABASE_ANON_KEY: (set)

This will fix the "invalid or expired" reset password link issues.