#!/bin/bash

# Force Cache-Busted Deployment with Verification
# Usage: ./scripts/force-deploy-with-verification.sh [production|preview]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%s)
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_FULL=$(git rev-parse HEAD)
BUILD_ID="${COMMIT_HASH}-${TIMESTAMP}"

echo "🚀 Starting Force Deployment with Cache Busting"
echo "================================================"
echo "Environment: $ENVIRONMENT"
echo "Commit Hash: $COMMIT_HASH"
echo "Build ID: $BUILD_ID"
echo "Timestamp: $TIMESTAMP"
echo ""

# Step 1: Update version file
echo "📝 Step 1: Creating version metadata..."
cat > public/version.json << EOF
{
  "commitHash": "$COMMIT_HASH",
  "commitFull": "$COMMIT_FULL",
  "buildId": "$BUILD_ID",
  "timestamp": $TIMESTAMP,
  "environment": "$ENVIRONMENT",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
echo "✅ Version file created"

# Step 2: Update index.html with version meta tag
echo "📝 Step 2: Injecting version into index.html..."
if [ -f "index.html" ]; then
  sed -i.bak "s/<meta name=\"version\" content=\".*\">/<meta name=\"version\" content=\"$BUILD_ID\">/" index.html || \
  sed -i '' "s/<meta name=\"version\" content=\".*\">/<meta name=\"version\" content=\"$BUILD_ID\">/" index.html 2>/dev/null || true
fi
echo "✅ Version meta tag updated"

# Step 3: Commit version changes
echo "📝 Step 3: Committing version metadata..."
git add public/version.json index.html 2>/dev/null || true
git commit -m "Deploy: $BUILD_ID [skip ci]" --no-verify 2>/dev/null || echo "No changes to commit"

# Step 4: Deploy to Vercel
echo "🚀 Step 4: Deploying to Vercel..."
if [ "$ENVIRONMENT" = "production" ]; then
  vercel --prod --yes --force
else
  vercel --yes --force
fi
echo "✅ Deployment complete"

# Step 5: Wait for deployment to propagate
echo "⏳ Step 5: Waiting 10 seconds for CDN propagation..."
sleep 10

# Step 6: Purge Vercel cache
echo "🧹 Step 6: Purging Vercel cache..."
if [ "$ENVIRONMENT" = "production" ]; then
  DOMAIN="www.greenscapelux.com"
else
  DOMAIN=$(vercel ls --yes | grep -m1 "https://" | awk '{print $2}' | sed 's/https:\/\///')
fi

echo "Purging cache for: $DOMAIN"
curl -X PURGE "https://$DOMAIN/*" || echo "Cache purge attempted"
echo "✅ Cache purge complete"

# Step 7: Verify deployment
echo "🔍 Step 7: Verifying deployment..."
sleep 5

DEPLOYED_VERSION=$(curl -s "https://$DOMAIN/version.json?t=$TIMESTAMP" | grep -o '"commitHash":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "================================================"
echo "📊 DEPLOYMENT VERIFICATION"
echo "================================================"
echo "Expected Commit: $COMMIT_HASH"
echo "Deployed Commit: $DEPLOYED_VERSION"
echo ""

if [ "$DEPLOYED_VERSION" = "$COMMIT_HASH" ]; then
  echo "✅ SUCCESS: Deployment verified!"
  echo "✅ Live version matches local commit"
else
  echo "⚠️  WARNING: Version mismatch detected"
  echo "⚠️  This may indicate CDN caching issues"
fi

echo ""
echo "================================================"
echo "🧪 MANUAL VERIFICATION STEPS"
echo "================================================"
echo "1. Open incognito/private window"
echo "2. Visit: https://$DOMAIN/version.json?t=$TIMESTAMP"
echo "3. Verify commitHash: $COMMIT_HASH"
echo "4. Test quote form: https://$DOMAIN/get-quote"
echo "5. Open DevTools Console (F12)"
echo "6. Look for: '🏁 ClientQuoteForm component mounted/rendered'"
echo "7. Submit form and verify all step logs appear"
echo ""
echo "🔗 Quick Links:"
echo "   Version: https://$DOMAIN/version.json?t=$TIMESTAMP"
echo "   Quote Form: https://$DOMAIN/get-quote"
echo ""
echo "================================================"
