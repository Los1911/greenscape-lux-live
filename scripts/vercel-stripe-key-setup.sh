#!/bin/bash

# Vercel Stripe Key Setup Script
# This script helps verify and document the Stripe key setup process

echo "======================================"
echo "GreenScape Lux - Stripe Key Setup"
echo "======================================"
echo ""

STRIPE_KEY="pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK"

echo "✓ Stripe Public Key (Live Mode):"
echo "  $STRIPE_KEY"
echo ""

echo "📋 MANUAL STEPS REQUIRED:"
echo ""
echo "1. Update Vercel Environment Variables"
echo "   → Go to: https://vercel.com/dashboard"
echo "   → Select: GreenScape Lux project"
echo "   → Navigate: Settings → Environment Variables"
echo "   → Add/Update:"
echo "     Name: VITE_STRIPE_PUBLIC_KEY"
echo "     Value: $STRIPE_KEY"
echo "     Environments: Production, Preview, Development"
echo ""

echo "2. Redeploy Application"
echo "   → Option A: Vercel Dashboard → Deployments → Redeploy"
echo "   → Option B: Run command below"
echo ""
echo "   git commit --allow-empty -m 'Deploy: Update Stripe key'"
echo "   git push origin main"
echo ""

echo "3. Verify in Browser Console"
echo "   → Visit: https://greenscapelux.com"
echo "   → Open: DevTools (F12) → Console"
echo "   → Check: VITE_STRIPE_PUBLIC_KEY value"
echo "   → Expected: $STRIPE_KEY"
echo ""

echo "4. Alternative: GitHub Pages Setup"
echo "   → Go to: Repository → Settings → Secrets and variables → Actions"
echo "   → New repository secret:"
echo "     Name: VITE_STRIPE_PUBLIC_KEY"
echo "     Value: $STRIPE_KEY"
echo ""

echo "======================================"
echo "✓ Local .env.local file already updated"
echo "✓ Code references standardized to VITE_STRIPE_PUBLIC_KEY"
echo "✓ GitHub Actions workflow configured"
echo ""
echo "⚠️  ACTION REQUIRED: Update Vercel/GitHub environment variables"
echo "======================================"
