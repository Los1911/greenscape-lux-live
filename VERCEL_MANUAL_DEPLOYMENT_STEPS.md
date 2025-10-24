# Manual Vercel Deployment Steps for GreenScape Lux

## Issue
greenscapelux.com is showing the default Create React App starter instead of your GreenScape Lux application.

## Solution: Manual Build & Deploy

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Build Your App Locally
```bash
# In your project root directory
npm run build
```

### Step 4: Deploy to Vercel
```bash
# Deploy the build output
vercel --prod

# When prompted:
# - Project name: greenscape-lux
# - Link to existing project: Y (if it exists)
# - Which scope: your-username
# - Link to greenscape-lux: Y
```

### Step 5: Configure Domain
```bash
# Add your custom domain
vercel domains add greenscapelux.com
vercel domains add www.greenscapelux.com

# Link domains to your project
vercel alias set your-deployment-url.vercel.app greenscapelux.com
vercel alias set your-deployment-url.vercel.app www.greenscapelux.com
```

## Alternative: Vercel Dashboard Method

### 1. Build Locally
```bash
npm run build
```

### 2. Upload via Dashboard
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Click "Browse" and select your `dist` folder
4. Set project name to "greenscape-lux"
5. Click "Deploy"

### 3. Configure Domain
1. Go to your project settings
2. Click "Domains"
3. Add "greenscapelux.com"
4. Add "www.greenscapelux.com"

## Verification Steps

### Check Build Output
```bash
# Verify dist folder contains:
ls dist/
# Should show: index.html, assets/, etc.
```

### Test Local Build
```bash
# Serve locally to test
npx serve dist
# Visit http://localhost:3000
```

### Verify Deployment
1. Visit greenscapelux.com
2. Should show GreenScape Lux landing page
3. Check browser console for errors

## Troubleshooting

### If Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### If Domain Still Shows Starter
1. Check Vercel project settings
2. Verify domain is linked to correct project
3. Clear browser cache
4. Wait 5-10 minutes for DNS propagation

### Common Issues
- **Wrong project linked**: Unlink old project, link new one
- **Build errors**: Check console output during build
- **DNS issues**: Verify domain settings in Vercel dashboard

## Quick Commands Summary
```bash
# Full deployment process
npm run build
vercel --prod
vercel alias set [deployment-url] greenscapelux.com
```

Execute these steps to deploy your GreenScape Lux app to greenscapelux.com.