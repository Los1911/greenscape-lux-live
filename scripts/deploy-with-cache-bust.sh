#!/bin/bash

# Deploy with Cache Busting Script
echo "🚀 Starting deployment with cache invalidation..."

# Generate new build timestamp
BUILD_TIME=$(date +%s)
BUILD_HASH=$(openssl rand -hex 4)

echo "📦 Build Info:"
echo "  Timestamp: $BUILD_TIME"
echo "  Hash: $BUILD_HASH"

# Set environment variables for build
export VITE_BUILD_TIME=$BUILD_TIME
export VITE_BUILD_HASH=$BUILD_HASH

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies
echo "📥 Installing dependencies..."
npm ci

# Build with cache busting
echo "🔨 Building with cache invalidation..."
npm run build

# Verify version.json was created
if [ -f "dist/version.json" ]; then
    echo "✅ Version file created successfully"
    cat dist/version.json
else
    echo "❌ Version file not found!"
    exit 1
fi

# Deploy to Vercel (or your hosting platform)
echo "🌐 Deploying to production..."
if command -v vercel &> /dev/null; then
    vercel --prod
else
    echo "⚠️  Vercel CLI not found. Please deploy manually."
fi

echo "🎉 Deployment complete with cache invalidation!"
echo "Users will automatically receive the latest version."