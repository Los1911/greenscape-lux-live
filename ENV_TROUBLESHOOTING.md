# Environment Variables Troubleshooting Guide

## Problem: `import.meta.env.VITE_SUPABASE_URL` is undefined

### Immediate Solutions

#### 1. Local Development Fix
```bash
# Create .env.local file (if missing)
cp .env.local.template .env.local

# OR create manually with this content:
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://mwvcbedvnimabfwubazz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY
VITE_SUPABASE_FUNCTIONS_URL=https://mwvcbedvnimabfwubazz.functions.supabase.co
VITE_SITE_URL=https://greenscapelux.com
VITE_ADMIN_EMAIL=cmatthews@greenscapelux.com
VITE_APP_ENV=development
EOF

# CRITICAL: Restart development server
npm run dev
```

#### 2. Vercel Production Fix
```bash
# Add environment variables to Vercel
vercel env add VITE_SUPABASE_URL
# Enter: https://mwvcbedvnimabfwubazz.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY

# Redeploy
vercel --prod
```

### Diagnostic Tools

#### Run Environment Debug Script
```bash
node scripts/env-debug.js
```

#### Check Browser Console
Look for these logs when app starts:
```
🔍 Environment Variables Check:
VITE_SUPABASE_URL: ✅ Set
VITE_SUPABASE_ANON_KEY: ✅ Set
```

### Common Issues & Fixes

#### Issue: Variables still undefined after creating .env.local
**Solution**: Restart development server completely
```bash
# Kill server (Ctrl+C)
npm run dev  # Start fresh
```

#### Issue: Works locally but not in production
**Solution**: Check Vercel environment variables
```bash
vercel env ls  # List all env vars
```

#### Issue: .env.local exists but variables not loading
**Solutions**:
1. Check file is in project root (same level as package.json)
2. Verify no syntax errors in .env.local
3. Ensure variables start with `VITE_` prefix
4. Clear browser cache and hard refresh

#### Issue: Getting "ConfigGate" screen
**Solution**: This means environment variables are missing
1. Follow local development fix above
2. Restart server
3. Refresh browser

### Verification Steps

#### 1. Check Files Exist
```bash
ls -la .env.local        # Should exist
ls -la .env.local.template  # Should exist as template
```

#### 2. Verify Content
```bash
cat .env.local  # Should show your variables
```

#### 3. Test Environment Loading
```bash
npm run dev
# Check browser console for environment variable logs
```

#### 4. Test Production Deployment
```bash
vercel env ls  # Should show your VITE_ variables
vercel --prod  # Deploy and test
```

### Advanced Debugging

#### Check Vite Configuration
```bash
cat vite.config.ts  # Should not have custom env config unless needed
```

#### Check Import Usage
Search for incorrect imports:
```bash
grep -r "process.env.VITE_" src/  # Should be empty (use import.meta.env instead)
```

#### Verify Build Process
```bash
npm run build  # Should complete without env errors
```

### Emergency Fallback

If environment variables still don't work, the app has fallback configurations in:
- `src/lib/runtimeConfig.ts` - Contains hardcoded fallbacks
- `src/lib/globalConfigInjector.ts` - Injects config at runtime

These will prevent the app from breaking but you should still fix the environment variables for proper configuration management.

### Success Indicators

✅ Browser console shows: "✅ All required environment variables are properly set"
✅ No ConfigGate screen appears
✅ App loads without Supabase connection errors
✅ `vercel env ls` shows all VITE_ variables