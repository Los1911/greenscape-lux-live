# Manual Vercel Deployment Guide for GreenScape Lux

## Current Issue
Your greenscapelux.com domain is showing the default Create React App starter page instead of your actual GreenScape Lux application.

## Solution: Manual Build and Deploy

### Step 1: Build Your Application Locally
```bash
# Navigate to your project directory
cd /path/to/your/greenscape-project

# Install dependencies (if not already done)
npm install

# Create production build
npm run build
```

### Step 2: Deploy via Vercel CLI

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy from your project directory
vercel --prod

# When prompted:
# - Link to existing project? YES
# - Select your greenscapelux project
# - Deploy to production? YES
```

#### Option B: Manual Upload via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Find your greenscapelux project
3. Click "Settings" → "Domains"
4. Verify both domains are properly configured:
   - greenscapelux.com
   - www.greenscapelux.com

### Step 3: Verify Build Settings
In Vercel Dashboard → Settings → General:

**Build & Development Settings:**
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Development Command: `npm run dev`

### Step 4: Environment Variables
Ensure all required environment variables are set in Vercel:
- Go to Settings → Environment Variables
- Add all variables from your `.env.local` file

### Step 5: Force New Deployment
```bash
# Force a fresh deployment
vercel --prod --force

# Or trigger via git push
git add .
git commit -m "Force deployment update"
git push origin main
```

### Step 6: Clear DNS/CDN Cache
```bash
# Clear Vercel cache
vercel --prod --force

# Wait 5-10 minutes for DNS propagation
# Test both domains:
# - https://greenscapelux.com
# - https://www.greenscapelux.com
```

## Troubleshooting

### If Still Showing CRA Starter:
1. Check deployment logs in Vercel dashboard
2. Verify build completed successfully
3. Check if correct Git branch is connected
4. Ensure no build errors in the logs

### Build Configuration Issues:
```json
// Ensure package.json has correct build script
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### Domain Configuration:
1. Verify both domains point to the same deployment
2. Check SSL certificates are active
3. Ensure no redirect loops

## Expected Result
After successful deployment, both domains should show:
- GreenScape Lux branding
- Professional landscaping service layout
- Hero section with "Transform Your Outdoor Space"
- Service offerings and contact forms

## Quick Test Commands
```bash
# Test domain resolution
curl -I https://greenscapelux.com
curl -I https://www.greenscapelux.com

# Check if deployment is live
vercel ls
```

## Contact Support
If issues persist:
1. Check Vercel deployment logs
2. Verify Git repository connection
3. Contact Vercel support with deployment ID