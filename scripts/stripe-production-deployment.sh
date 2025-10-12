#!/bin/bash

# 🚨 CRITICAL: Stripe Live Keys Production Deployment Script
# This script automates the deployment of Stripe live keys to production

set -e  # Exit on any error

echo "🚀 STRIPE PRODUCTION DEPLOYMENT AUTOMATION"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking Prerequisites...${NC}"

# Check if required tools are installed
command -v vercel >/dev/null 2>&1 || { echo -e "${RED}❌ Vercel CLI not installed. Install with: npm i -g vercel${NC}"; exit 1; }
command -v supabase >/dev/null 2>&1 || { echo -e "${RED}❌ Supabase CLI not installed. Install with: npm i -g supabase${NC}"; exit 1; }

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Validate environment variables
echo -e "${BLUE}🔍 Validating Environment Variables...${NC}"

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
    echo -e "${RED}❌ STRIPE_PUBLISHABLE_KEY not set${NC}"
    echo "Set it with: export STRIPE_PUBLISHABLE_KEY=pk_live_your_key"
    exit 1
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY not set${NC}"
    echo "Set it with: export STRIPE_SECRET_KEY=sk_live_your_key"
    exit 1
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET not set${NC}"
    echo "Set it with: export STRIPE_WEBHOOK_SECRET=whsec_your_secret"
    exit 1
fi

# Validate key formats
if [[ ! $STRIPE_PUBLISHABLE_KEY == pk_live_* ]]; then
    echo -e "${RED}❌ STRIPE_PUBLISHABLE_KEY must start with pk_live_${NC}"
    exit 1
fi

if [[ ! $STRIPE_SECRET_KEY == sk_live_* ]]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY must start with sk_live_${NC}"
    exit 1
fi

if [[ ! $STRIPE_WEBHOOK_SECRET == whsec_* ]]; then
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET must start with whsec_${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All Stripe keys validated${NC}"
echo ""

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"

echo "Setting VITE_STRIPE_PUBLISHABLE_KEY..."
echo "$STRIPE_PUBLISHABLE_KEY" | vercel env add VITE_STRIPE_PUBLISHABLE_KEY production --force

echo "Setting STRIPE_SECRET_KEY..."
echo "$STRIPE_SECRET_KEY" | vercel env add STRIPE_SECRET_KEY production --force

echo "Setting STRIPE_WEBHOOK_SECRET..."
echo "$STRIPE_WEBHOOK_SECRET" | vercel env add STRIPE_WEBHOOK_SECRET production --force

echo -e "${GREEN}✅ Vercel environment variables updated${NC}"
echo ""

# Deploy to Supabase
echo -e "${BLUE}🗄️  Deploying to Supabase...${NC}"

supabase secrets set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --project-ref mwvcbedvnimabfwubazz
supabase secrets set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" --project-ref mwvcbedvnimabfwubazz

echo -e "${GREEN}✅ Supabase secrets updated${NC}"
echo ""

# Trigger deployment
echo -e "${BLUE}🚀 Triggering Production Deployment...${NC}"

vercel --prod --force

echo -e "${GREEN}✅ Production deployment triggered${NC}"
echo ""

# Run validation
echo -e "${BLUE}🧪 Running Post-Deployment Validation...${NC}"

node scripts/validate-stripe-production.js

echo ""
echo -e "${GREEN}🎉 STRIPE PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Test payment processing with live card"
echo "2. Verify webhook events in Stripe dashboard"
echo "3. Check commission calculations"
echo "4. Monitor error logs for 24 hours"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "• Stripe Dashboard: https://dashboard.stripe.com"
echo "• Vercel Dashboard: https://vercel.com/dashboard"
echo "• Supabase Dashboard: https://supabase.com/dashboard"
echo ""