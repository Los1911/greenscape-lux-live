#!/bin/bash

# =============================================================================
# Force Deploy with Cache Verification
# =============================================================================
# This script forces a clean production deployment and verifies the cache
# is properly busted.
#
# Usage: ./scripts/force-deploy-with-verification.sh
# =============================================================================

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 GreenScape Lux - Force Deploy with Cache Verification"
echo "═══════════════════════════════════════════════════════════════"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Expected version (update this on each deployment)
EXPECTED_VERSION="admin-jobs-fix-v3-20260126"
PRODUCTION_URL="https://greenscapelux.com"

echo ""
echo "📦 Expected Version: $EXPECTED_VERSION"
echo "🌐 Production URL: $PRODUCTION_URL"
echo ""

# Step 1: Clean local build artifacts
echo "🧹 Step 1: Cleaning local build artifacts..."
rm -rf dist node_modules/.vite
echo "   ✅ Build artifacts cleaned"

# Step 2: Install dependencies
echo ""
echo "📥 Step 2: Installing dependencies..."
npm ci
echo "   ✅ Dependencies installed"

# Step 3: Build the application
echo ""
echo "🔨 Step 3: Building application..."
npm run build
echo "   ✅ Build completed"

# Step 4: Verify build output contains correct version
echo ""
echo "🔍 Step 4: Verifying build output..."
if grep -r "admin-jobs-fix-v3" dist/assets/*.js > /dev/null 2>&1; then
    echo "   ✅ Build contains correct version marker"
else
    echo -e "   ${YELLOW}⚠️  Version marker not found in build output${NC}"
fi

# Step 5: Check version.json in dist
echo ""
echo "📄 Step 5: Checking version.json..."
if [ -f "dist/version.json" ]; then
    cat dist/version.json
    echo ""
    echo "   ✅ version.json exists"
else
    echo -e "   ${RED}❌ version.json not found in dist${NC}"
fi

# Step 6: Deploy to Vercel (if Vercel CLI is available)
echo ""
echo "🚀 Step 6: Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    echo "   Vercel CLI found, deploying..."
    vercel --prod --force --yes
    echo "   ✅ Deployment initiated"
else
    echo -e "   ${YELLOW}⚠️  Vercel CLI not found. Please deploy manually:${NC}"
    echo "      1. Go to Vercel Dashboard"
    echo "      2. Select your project"
    echo "      3. Click 'Redeploy' with 'Clear Build Cache' option"
fi

# Step 7: Wait for deployment to propagate
echo ""
echo "⏳ Step 7: Waiting for deployment to propagate (30 seconds)..."
sleep 30

# Step 8: Verify production deployment
echo ""
echo "🔍 Step 8: Verifying production deployment..."

# Fetch version.json from production
PROD_VERSION=$(curl -s -H "Cache-Control: no-cache" "$PRODUCTION_URL/version.json?t=$(date +%s)" 2>/dev/null)

if [ -n "$PROD_VERSION" ]; then
    echo "   Production version.json:"
    echo "$PROD_VERSION" | head -20
    echo ""
    
    # Check if version matches
    if echo "$PROD_VERSION" | grep -q "$EXPECTED_VERSION"; then
        echo -e "   ${GREEN}✅ Production is serving correct version!${NC}"
    else
        echo -e "   ${RED}❌ Production version mismatch!${NC}"
        echo "      Expected: $EXPECTED_VERSION"
        echo "      Please check Vercel deployment status"
    fi
    
    # Check query source
    if echo "$PROD_VERSION" | grep -q '"querySource": "jobs"'; then
        echo -e "   ${GREEN}✅ Query source is 'jobs' (correct)${NC}"
    else
        echo -e "   ${RED}❌ Query source is NOT 'jobs' - stale deployment!${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Could not fetch version.json from production${NC}"
    echo "      URL: $PRODUCTION_URL/version.json"
fi

# Step 9: Summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 Deployment Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Open $PRODUCTION_URL in an incognito window"
echo "2. Open DevTools Console (F12)"
echo "3. Look for: 'Build Version: $EXPECTED_VERSION'"
echo "4. Look for: 'Query Source: jobs'"
echo "5. Navigate to /admin-dashboard"
echo "6. Verify no 400 errors in Network tab"
echo ""
echo "If still seeing old version:"
echo "1. Clear browser cache completely"
echo "2. Check Vercel Dashboard for deployment status"
echo "3. Verify domain is pointing to correct project"
echo ""
echo "═══════════════════════════════════════════════════════════════"
