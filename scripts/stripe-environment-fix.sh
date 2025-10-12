#!/bin/bash

# Stripe Environment Fix Script
# Fixes runtime environment issues and security vulnerabilities

set -e

echo "🔧 STRIPE ENVIRONMENT FIX"
echo "========================="
echo "Timestamp: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are available
check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not found. Install with: npm i -g vercel"
        exit 1
    fi
    
    if ! command -v supabase &> /dev/null; then
        log_warning "Supabase CLI not found. Some operations may be limited."
    fi
    
    log_success "Requirements check complete"
}

# Fix client-side configuration (security fix)
fix_client_config() {
    log_info "Fixing client-side configuration..."
    
    # Create secure config that only exposes publishable key
    cat > src/lib/stripeSecure.ts << 'EOF'
import { loadStripe } from '@stripe/stripe-js';
import { logger } from '../utils/logger';

// Secure Stripe configuration - only client-safe keys
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey || stripePublishableKey === 'undefined') {
  const errorMsg = 'CRITICAL: VITE_STRIPE_PUBLISHABLE_KEY missing from environment';
  logger.error(errorMsg, null, 'StripeSecure');
  throw new Error(errorMsg);
}

// Validate key format
if (!stripePublishableKey.startsWith('pk_')) {
  const errorMsg = `Invalid Stripe publishable key format: ${stripePublishableKey.substring(0, 10)}...`;
  logger.error(errorMsg, null, 'StripeSecure');
  throw new Error(errorMsg);
}

export const getStripe = async () => {
  try {
    return await loadStripe(stripePublishableKey);
  } catch (error) {
    logger.error('Failed to load Stripe.js', error, 'StripeSecure');
    throw new Error('Failed to load Stripe.js');
  }
};

export const stripeConfig = {
  publishableKey: stripePublishableKey,
  environment: stripePublishableKey.startsWith('pk_live_') ? 'live' : 'test',
  currency: 'usd',
  country: 'US'
};

export const isLiveMode = () => stripePublishableKey.startsWith('pk_live_');
EOF
    
    log_success "Created secure client configuration"
}

# Configure Vercel environment variables
configure_vercel_env() {
    log_info "Configuring Vercel environment variables..."
    
    # Only set client-safe environment variables in Vercel
    log_info "Setting VITE_STRIPE_PUBLISHABLE_KEY in Vercel..."
    
    # Check if already exists
    if vercel env ls | grep -q "VITE_STRIPE_PUBLISHABLE_KEY"; then
        log_warning "VITE_STRIPE_PUBLISHABLE_KEY already exists in Vercel"
        log_info "To update: vercel env rm VITE_STRIPE_PUBLISHABLE_KEY production"
        log_info "Then: vercel env add VITE_STRIPE_PUBLISHABLE_KEY production"
    else
        log_info "Add VITE_STRIPE_PUBLISHABLE_KEY to Vercel:"
        log_info "Run: vercel env add VITE_STRIPE_PUBLISHABLE_KEY production"
        log_info "Value: pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK"
    fi
    
    log_success "Vercel environment configuration instructions provided"
}

# Configure Supabase Vault (server-side secrets)
configure_supabase_vault() {
    log_info "Configuring Supabase Vault for server-side secrets..."
    
    log_info "Add the following secrets to Supabase Vault:"
    echo ""
    echo "1. STRIPE_SECRET_KEY (server-side only)"
    echo "   Value: sk_live_your_actual_secret_key_here"
    echo ""
    echo "2. STRIPE_WEBHOOK_SECRET (server-side only)"  
    echo "   Value: whsec_your_actual_webhook_secret_here"
    echo ""
    log_info "Access: Supabase Dashboard > Project Settings > Vault"
    
    log_success "Supabase Vault configuration instructions provided"
}

# Trigger production redeploy
trigger_redeploy() {
    log_info "Triggering production redeploy..."
    
    # Force complete rebuild
    log_info "Running: vercel --prod --force"
    
    if vercel --prod --force; then
        log_success "Production deployment triggered successfully"
        log_info "Monitor deployment at: https://vercel.com/dashboard"
    else
        log_error "Deployment failed. Check Vercel dashboard for details."
        return 1
    fi
}

# Validate environment after deployment
validate_environment() {
    log_info "Validating environment configuration..."
    
    # Wait for deployment to complete
    log_info "Waiting 30 seconds for deployment to complete..."
    sleep 30
    
    # Run diagnostic
    if [ -f "scripts/stripe-validation-diagnostic.js" ]; then
        log_info "Running Stripe validation diagnostic..."
        node scripts/stripe-validation-diagnostic.js
    else
        log_warning "Stripe validation diagnostic not found"
    fi
}

# Main execution
main() {
    echo "Starting Stripe environment fix process..."
    echo ""
    
    check_requirements
    echo ""
    
    fix_client_config
    echo ""
    
    configure_vercel_env
    echo ""
    
    configure_supabase_vault
    echo ""
    
    log_info "Manual steps required:"
    echo "1. Add VITE_STRIPE_PUBLISHABLE_KEY to Vercel (production)"
    echo "2. Add STRIPE_SECRET_KEY to Supabase Vault"
    echo "3. Add STRIPE_WEBHOOK_SECRET to Supabase Vault"
    echo ""
    
    read -p "Have you completed the manual steps above? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        trigger_redeploy
        echo ""
        validate_environment
        
        log_success "Stripe environment fix completed!"
        log_info "Check STRIPE_PRODUCTION_DEPLOYMENT_STATUS.md for next steps"
    else
        log_warning "Please complete the manual steps and run this script again"
        exit 1
    fi
}

# Run main function
main "$@"