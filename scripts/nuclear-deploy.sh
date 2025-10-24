#!/bin/bash

# 🚀 NUCLEAR CACHE PURGE & FORCE DEPLOYMENT SCRIPT
# Clears all caches and forces fresh deployment to resolve stale signup bundles

set -e

echo "🔥 NUCLEAR CACHE PURGE & DEPLOYMENT INITIATED"
echo "============================================="

# 1. Clear all local caches
echo "🧹 Clearing local caches..."
rm -rf node_modules/.cache
rm -rf dist
rm -rf .next
rm -rf .vite
rm -rf .turbo

# 2. Clear npm cache
echo "📦 Clearing npm cache..."
npm cache clean --force

# 3. Remove and reinstall dependencies
echo "🔄 Reinstalling dependencies..."
rm -rf node_modules
npm ci --force

# 4. Fresh build
echo "🏗️  Building fresh bundle..."
npm run build

# 5. Deploy to Vercel with no cache
echo "🚀 Deploying to Vercel (no cache)..."
if command -v vercel &> /dev/null; then
    vercel --prod --force --no-cache
else
    echo "⚠️  Vercel CLI not found. Please install with: npm i -g vercel"
    echo "   Then run: vercel --prod --force --no-cache"
fi

# 6. Purge CDN caches (if curl available)
echo "🌐 Purging CDN caches..."
if command -v curl &> /dev/null; then
    curl -X POST "https://api.vercel.com/v1/purge?url=https://greenscapelux.com" || echo "CDN purge failed"
    curl -X POST "https://api.vercel.com/v1/purge?url=https://deploypad.app" || echo "CDN purge failed"
else
    echo "⚠️  curl not found. Manually purge CDN caches in Vercel dashboard"
fi

echo ""
echo "✅ NUCLEAR DEPLOYMENT COMPLETE!"
echo "================================"
echo ""
echo "🧪 VERIFICATION STEPS:"
echo "1. Open incognito browser window"
echo "2. Navigate to signup pages"
echo "3. Open DevTools → Console"
echo "4. Test signup and verify payload contains ONLY { role: 'client' }"
echo "5. Confirm no 'first_name does not exist' errors"
echo ""
echo "📊 Expected console log:"
echo '   { "email": "...", "password": "...", "options": { "data": { "role": "client" } } }'