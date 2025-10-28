import { loadStripe } from '@stripe/stripe-js';
import { logger } from '../utils/logger';

// Environment validation with production logging
console.log('Supabase URL loaded:', import.meta.env.VITE_SUPABASE_URL);
console.log('Stripe key present:', !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
logger.debug(
  'Stripe environment check',
  {
    NODE_ENV: import.meta.env.MODE,
    hasStripeKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  },
  'StripeConfig'
);

// ✅ Get Stripe publishable key from environment variable with fallback
const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK';

// 🧩 Validate presence and format
if (!stripePublishableKey || stripePublishableKey === 'undefined') {
  const errorMsg = `CRITICAL: VITE_STRIPE_PUBLISHABLE_KEY is ${
    !stripePublishableKey ? 'missing' : 'undefined string'
  } in environment variables. Using fallback key.`;
  logger.warn(errorMsg, null, 'StripeConfig');
}

if (!stripePublishableKey.startsWith('pk_')) {
  const errorMsg = `CRITICAL: Invalid Stripe key format. Expected pk_live_ or pk_test_, got: ${stripePublishableKey.substring(
    0,
    10
  )}...`;
  logger.error(errorMsg, null, 'StripeConfig');
  throw new Error(errorMsg);
}

// ✅ Load Stripe.js safely
export const getStripe = async () => {
  try {
    return await loadStripe(stripePublishableKey);
  } catch (error) {
    logger.error('Failed to load Stripe.js', error, 'StripeConfig');
    throw new Error('Failed to load Stripe.js');
  }
};

// Singleton pattern for reusing the Stripe instance
let stripePromise: Promise<any> | null = null;
export const stripe = () => {
  if (!stripePromise) {
    stripePromise = getStripe();
  }
  return stripePromise;
};

// ✅ Stripe configuration for runtime checks
export const stripeConfig = {
  publishableKey: stripePublishableKey,
  environment: stripePublishableKey.startsWith('pk_live_') ? 'live' : 'test',
  currency: 'usd',
  country: 'US'
};

// Helper for determining mode
export const isLiveMode = () => stripePublishableKey.startsWith('pk_live_');

// Export key for external use
export { stripePublishableKey };