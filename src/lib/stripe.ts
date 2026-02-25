import { loadStripe } from '@stripe/stripe-js';
import { logger } from '../utils/logger';

// [STRIPE_CONFIG] Environment validation with production logging
console.log('[STRIPE_CONFIG] Supabase URL loaded:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('[STRIPE_CONFIG] Stripe key present:', !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
logger.debug('Stripe environment check', {
  NODE_ENV: import.meta.env.NODE_ENV,
  hasStripeKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
}, 'StripeConfig');

// Get Stripe publishable key from environment variable - NO FALLBACK
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Validate Stripe configuration but DON'T throw - allow app to render
let stripeConfigError: string | null = null;

if (!stripePublishableKey || stripePublishableKey === 'undefined' || stripePublishableKey.includes('${')) {
  stripeConfigError = `[STRIPE_CONFIG] WARNING: VITE_STRIPE_PUBLISHABLE_KEY is missing, undefined, or not properly configured. Stripe features will be disabled.`;
  logger.warn(stripeConfigError, null, 'StripeConfig');
  console.warn(stripeConfigError);
} else if (!stripePublishableKey.startsWith('pk_')) {
  stripeConfigError = `[STRIPE_CONFIG] WARNING: Invalid Stripe key format. Expected pk_live_ or pk_test_. Stripe features will be disabled.`;
  logger.warn(stripeConfigError, null, 'StripeConfig');
  console.warn(stripeConfigError);
}

export const getStripe = async () => {
  // If there's a configuration error, return null instead of throwing
  if (stripeConfigError) {
    console.warn('[STRIPE_CONFIG] Cannot load Stripe:', stripeConfigError);
    return null;
  }
  
  try {
    return await loadStripe(stripePublishableKey);
  } catch (error) {
    logger.error('[STRIPE_CONFIG] Failed to load Stripe.js', error, 'StripeConfig');
    console.error('[STRIPE_CONFIG] Failed to load Stripe.js', error);
    return null;
  }
};

// Export stripePromise for use with Stripe Elements
export const stripePromise = stripeConfigError ? Promise.resolve(null) : loadStripe(stripePublishableKey);

export const stripe = () => {
  return stripePromise;
};

// Stripe configuration for production
export const stripeConfig = {
  publishableKey: stripePublishableKey || 'NOT_CONFIGURED',
  environment: stripePublishableKey?.startsWith('pk_live_') ? 'live' : 'test',
  currency: 'usd',
  country: 'US',
  isConfigured: !stripeConfigError
};

// Export STRIPE_CONFIG as alias for compatibility
export const STRIPE_CONFIG = {
  ...stripeConfig,
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#10b981',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
    },
  },
};

// Validate that we're using live keys
export const isLiveMode = () => {
  return stripePublishableKey?.startsWith('pk_live_') || false;
};

// Check if Stripe is properly configured
export const isStripeConfigured = () => {
  return !stripeConfigError && !!stripePublishableKey;
};

// DO NOT export the key itself - only use internally
if (stripeConfigError) {
  console.warn('[STRIPE_CONFIG] Stripe NOT configured - payment features will be disabled');
} else {
  console.log('[STRIPE_CONFIG] Stripe initialized in', stripeConfig.environment, 'mode');
}
