#!/bin/bash

# GreenScape Lux Production Environment Auto-Fix Script
# Automatically configures missing environment variables and triggers clean redeploy

set -e

echo "🚀 GreenScape Lux Production Environment Auto-Fix"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Login check
echo -e "${BLUE}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please login:${NC}"
    vercel login
fi

echo -e "${GREEN}✅ Vercel CLI ready${NC}"

# Environment variables to configure
declare -A ENV_VARS=(
    # Client variables (exposed to browser)
    ["VITE_SUPABASE_URL"]="https://mwvcbedvnimabfwubazz.supabase.co"
    ["VITE_SUPABASE_ANON_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2FfXwRvar5UqQSZVK5WTtFfmPZ0HskSY"
    ["VITE_GOOGLE_MAPS_API_KEY"]="AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4"
    
    # Server variables (secure, not exposed)
    ["SUPABASE_URL"]="https://mwvcbedvnimabfwubazz.supabase.co"
    ["SUPABASE_ANON_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2FfXwRvar5UqQSZVK5WTtFfmPZ0HskSY"
)

# Variables that require manual input (sensitive)
MANUAL_VARS=(
    "VITE_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_SECRET_KEY" 
    "STRIPE_WEBHOOK_SECRET"
    "SUPABASE_SERVICE_ROLE_KEY"
    "RESEND_API_KEY"
)

echo -e "${BLUE}🔧 Configuring environment variables...${NC}"

# Auto-configure known safe variables
for var_name in "${!ENV_VARS[@]}"; do
    echo -e "${YELLOW}Setting ${var_name}...${NC}"
    echo "${ENV_VARS[$var_name]}" | vercel env add "$var_name" production --force || true
    echo "${ENV_VARS[$var_name]}" | vercel env add "$var_name" preview --force || true
done

echo -e "${GREEN}✅ Auto-configured safe environment variables${NC}"

# Prompt for sensitive variables
echo -e "${YELLOW}⚠️  Manual configuration required for sensitive variables:${NC}"
for var_name in "${MANUAL_VARS[@]}"; do
    echo -e "${BLUE}Please set ${var_name}:${NC}"
    echo "vercel env add $var_name production"
    echo "vercel env add $var_name preview"
    echo ""
done

# Check current environment status
echo -e "${BLUE}📋 Current environment variables:${NC}"
vercel env ls || true

# Offer to trigger deployment
echo -e "${YELLOW}🚀 Ready to deploy with updated environment?${NC}"
read -p "Deploy now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Triggering production deployment...${NC}"
    
    # Force clean deployment
    vercel --prod --force --no-cache
    
    echo -e "${GREEN}✅ Deployment triggered!${NC}"
    echo -e "${BLUE}🌐 Check status at: https://vercel.com/dashboard${NC}"
    
    # Wait and test
    echo -e "${YELLOW}⏳ Waiting 30 seconds for deployment to propagate...${NC}"
    sleep 30
    
    echo -e "${BLUE}🧪 Testing production endpoint...${NC}"
    curl -I https://greenscape-lux.vercel.app/ || echo "Endpoint test failed"
    
else
    echo -e "${YELLOW}⚠️  Deployment skipped. Run manually when ready:${NC}"
    echo "vercel --prod --force --no-cache"
fi

echo -e "${GREEN}🎉 Auto-fix script completed!${NC}"
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Verify all sensitive variables are set"
echo "2. Test login functionality in production"
echo "3. Monitor dashboard loading"
echo "4. Check browser console for fallback warnings"