#!/bin/bash
# Nuclear Cache Purge and Redeploy Script
# This script forces a complete cache purge and redeploy

echo "🚀 NUCLEAR CACHE PURGE AND REDEPLOY INITIATED"
echo "============================================="

# Step 1: Clear all local caches
echo "1. Clearing local caches..."
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist
rm -rf build
rm -rf .vercel
rm -f .env.local.backup

# Step 2: Reinstall dependencies
echo "2. Reinstalling dependencies..."
npm cache clean --force
rm -rf node_modules
npm install

# Step 3: Create timestamp for cache busting
TIMESTAMP=$(date +%s)
echo "3. Creating cache-busting timestamp: $TIMESTAMP"

# Step 4: Update package.json with cache-busting version
echo "4. Updating package.json for cache busting..."
cp package.json package.json.cache-bust-$TIMESTAMP

# Step 5: Build with fresh cache
echo "5. Building with fresh cache..."
npm run build

echo "✅ NUCLEAR CACHE PURGE COMPLETE"
echo "Next steps:"
echo "1. Verify your .env.local file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
echo "2. Set environment variables in your hosting provider"
echo "3. Deploy with forced cache invalidation"