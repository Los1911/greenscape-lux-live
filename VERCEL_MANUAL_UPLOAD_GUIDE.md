# GreenScape Lux - Manual Vercel Upload Guide

## Quick Upload Steps

### Step 1: Build the Project
```bash
# Install dependencies
npm install

# Create production build
npm run build
```

### Step 2: Upload via Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy the build folder
vercel --prod

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? Select your account
# - Link to existing project? Y (if exists) or N (new project)
# - Project name: greenscape-lux
# - Directory: ./dist (or ./build)
```

### Step 3: Configure Domain
```bash
# Add custom domain
vercel domains add greenscapelux.com

# Link domain to project
vercel domains link greenscapelux.com greenscape-lux
```

## Alternative: Dashboard Upload

### 1. Build Locally
```bash
npm run build
```

### 2. Zip Build Folder
- Compress your `dist/` or `build/` folder into a ZIP file

### 3. Upload via Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select "Import Third-Party Git Repository"
4. Choose "Deploy from ZIP"
5. Upload your build ZIP file
6. Configure:
   - Project Name: `greenscape-lux`
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: Leave empty (pre-built)
   - Output Directory: `./`

### 4. Configure Domain in Dashboard
1. Go to Project Settings → Domains
2. Add `greenscapelux.com`
3. Verify DNS settings if needed

## Environment Variables Setup

### Via CLI
```bash
# Set environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
vercel env add VITE_GOOGLE_MAPS_API_KEY production
```

### Via Dashboard
1. Project Settings → Environment Variables
2. Add each variable for Production environment

## Verification Steps

### 1. Check Deployment
```bash
# Get deployment URL
vercel ls

# Check deployment status
vercel inspect [deployment-url]
```

### 2. Test Domain
- Visit `https://greenscapelux.com`
- Verify app loads correctly
- Test key functionality

### 3. Check Environment Variables
```bash
# List environment variables
vercel env ls
```

## Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Domain Not Working
1. Check DNS settings in domain registrar
2. Verify domain is properly linked in Vercel
3. Wait for DNS propagation (up to 48 hours)

### Environment Variables Missing
```bash
# Pull environment variables
vercel env pull .env.local

# Verify variables are set
vercel env ls
```

## Quick Commands Summary

```bash
# Complete deployment flow
npm run build
vercel --prod
vercel domains add greenscapelux.com
vercel domains link greenscapelux.com greenscape-lux

# Verify deployment
curl -I https://greenscapelux.com
```

## Support

If deployment fails:
1. Check build logs: `vercel logs [deployment-url]`
2. Verify environment variables: `vercel env ls`
3. Test locally: `npm run preview`
4. Check Vercel dashboard for detailed error messages

Your GreenScape Lux app should now be live at https://greenscapelux.com!