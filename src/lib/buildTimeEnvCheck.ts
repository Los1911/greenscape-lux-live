// Build-time environment variable validation
const env = import.meta.env;

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'VITE_GOOGLE_MAPS_API_KEY'
];

const missingVars = requiredVars.filter(varName => !env[varName]);
const allVarsPresent = missingVars.length === 0;

if (!allVarsPresent && env.MODE === 'production') {
  console.warn('[Build] Missing environment variables:', missingVars);
}

export const buildTimeEnvCheck = {
  supabaseUrl: env.VITE_SUPABASE_URL,
  supabaseKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  isValid: allVarsPresent
};

export default buildTimeEnvCheck;
