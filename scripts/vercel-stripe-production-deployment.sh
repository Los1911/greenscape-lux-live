#!/bin/bash

# GreenScape Lux - Vercel Stripe Production Deployment Script
# This script updates the Stripe public key and redeploys to production

set -e

echo "🚀 GreenScape Lux - Vercel Stripe Key Update & Deployment"
echo "=========================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel@latest
fi

# Check for VERCEL_TOKEN
if [ -z "$VERCEL_TOKEN" ]; then
    echo "⚠️  VERCEL_TOKEN not found in environment"
    echo "Please set it: export VERCEL_TOKEN=your_token_here"
    echo "Get your token from: https://vercel.com/account/tokens"
    exit 1
fi

STRIPE_KEY="pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK"

echo ""
echo "Step 1: Removing old VITE_STRIPE_PUBLISHABLE_KEY (if exists)..."
vercel env rm VITE_STRIPE_PUBLISHABLE_KEY production --token=$VERCEL_TOKEN --yes 2>/dev/null || echo "  ℹ️  Old variable not found (OK)"

echo ""
echo "Step 2: Adding VITE_STRIPE_PUBLIC_KEY..."
echo "$STRIPE_KEY" | vercel env add VITE_STRIPE_PUBLIC_KEY production --token=$VERCEL_TOKEN

echo ""
echo "Step 3: Deploying to production..."
vercel --prod --token=$VERCEL_TOKEN --yes

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🔍 VERIFICATION STEPS:"
echo "1. Open: https://your-domain.vercel.app"
echo "2. Open DevTools → Console"
echo "3. Look for: VITE_STRIPE_PUBLIC_KEY: pk_live_51S1Ht0K6kWkUsx..."
echo ""
echo "If you see the key, Stripe is configured correctly! ✨"
