# Vercel Deployment Fix Guide for GreenScape Lux

## Issue Diagnosis
Your Vercel deployment is showing the default React starter page instead of your GreenScape Lux app. This is likely due to one of these configuration issues:

## Root Cause Analysis
Based on your project structure, the issue is most likely:

1. **Wrong Root Directory**: Vercel might be deploying from the wrong folder
2. **Build Command Issues**: The build process isn't finding your actual app
3. **GitHub Connection Problems**: The repository connection might be pointing to the wrong branch or folder

## Step-by-Step Fix

### 1. Check Vercel Project Settings
1. Go to your Vercel dashboard
2. Select your GreenScape Lux project
3. Go to **Settings** → **General**
4. Verify these settings:

```
Framework Preset: Vite
Root Directory: ./  (should be root, not a subfolder)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 2. Verify GitHub Repository Connection
1. In Vercel Settings → **Git**
2. Ensure it's connected to the correct repository
3. Check that it's deploying from the `main` or `master` branch
4. Make sure the repository contains your actual GreenScape Lux code (not a default React template)

### 3. Force a Fresh Deployment
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Check "Use existing Build Cache" should be **UNCHECKED**
4. Click **Redeploy**

### 4. Environment Variables Check
Ensure these environment variables are set in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- Any other environment variables your app needs

### 5. Build Output Verification
Your `dist` folder after build should contain:
- `index.html` (with GreenScape Lux title and meta tags)
- `assets/` folder with your compiled JS/CSS
- Your app's actual content, not default React content

### 6. Domain Assignment Fix
Once the app is deploying correctly:
1. Go to **Settings** → **Domains**
2. Add `greenscapelux.com`
3. Add `www.greenscapelux.com`
4. Set up DNS records as instructed by Vercel

## DNS Configuration
For your domain registrar, set these DNS records:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

## Troubleshooting Commands
Run these locally to verify your build works:

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to see if your built app shows GreenScape Lux content.

## Quick Verification Checklist
- [ ] Repository contains GreenScape Lux code (not default React)
- [ ] Root directory is set to `./` in Vercel
- [ ] Build command is `npm run build`
- [ ] Output directory is `dist`
- [ ] Environment variables are configured
- [ ] Fresh deployment without build cache
- [ ] Local build produces correct output

## If Still Not Working
1. **Check the deployment logs** in Vercel for any build errors
2. **Verify your repository** actually contains the GreenScape Lux code
3. **Create a new Vercel project** and import your repository fresh
4. **Check if you have multiple repositories** and ensure you're deploying the right one

The most common cause is that Vercel is connected to a different repository or branch that contains the default React template instead of your actual GreenScape Lux application.