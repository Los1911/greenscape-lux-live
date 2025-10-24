import { loadStripe } from '@stripe/stripe-js';
import { logger } from '../utils/logger';

// Environment validation with production logging
console.log('Supabase URL loaded:', import.meta.env.VITE_SUPABASE_URL);
console.log('Stripe key present:', !!import.meta.env.VITE_STRIPE_PUBLIC_KEY);
logger.debug('Stripe environment check', {
  NODE_ENV: import.meta.env.NODE_ENV,
  hasStripeKey: !!import.meta.env.VITE_STRIPE_PUBLIC_KEY
}, 'StripeConfig');

// Get Stripe publishable key from environment variable with fallback
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK';


if (!stripePublishableKey || stripePublishableKey === 'undefined') {
  const errorMsg = `CRITICAL: VITE_STRIPE_PUBLIC_KEY is ${!stripePublishableKey ? 'missing' : 'undefined string'} in environment variables. Using fallback key.`;
  logger.warn(errorMsg, null, 'StripeConfig');
}

// Validate key format
if (!stripePublishableKey.startsWith('pk_')) {
  const errorMsg = `CRITICAL: Invalid Stripe key format. Expected pk_live_ or pk_test_, got: ${stripePublishableKey.substring(0, 10)}...`;
  logger.error(errorMsg, null, 'StripeConfig');
  throw new Error(errorMsg);
}

export const getStripe = async () => {
  try {
    return await loadStripe(stripePublishableKey);
  } catch (error) {
    logger.error('Failed to load Stripe.js', error, 'StripeConfig');
    throw new Error('Failed to load Stripe.js');
  }
};

let stripePromise: Promise<any> | null = null;
export const stripe = () => {
  if (!stripePromise) {
    stripePromise = getStripe();
  }
  return stripePromise;
};

// Stripe configuration for production
export const stripeConfig = {
  publishableKey: stripePublishableKey,
  environment: stripePublishableKey.startsWith('pk_live_') ? 'live' : 'test',
  currency: 'usd',
  country: 'US'
};

// Validate that we're using live keys
export const isLiveMode = () => {
  return stripePublishableKey.startsWith('pk_live_');
};

// Export for use in components
export { stripePublishableKey };