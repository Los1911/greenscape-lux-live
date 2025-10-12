// Build-time Environment Variable Checker
// This runs during build to verify environment variables are available

console.log('🔍 BUILD-TIME ENVIRONMENT CHECK');
console.log('================================');

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const env = (typeof import !== 'undefined' && import.meta?.env) || {};
  const value = env[varName];
  const status = value ? '✅ FOUND' : '❌ MISSING';
  const displayValue = value ? 
    (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 
    'undefined';
  
  console.log(`${status} ${varName}: ${displayValue}`);
  
  if (!value) {
    allVarsPresent = false;
  }
});

console.log('================================');
console.log(`Build Environment Status: ${allVarsPresent ? '✅ VALID' : '❌ INVALID'}`);

if (!allVarsPresent) {
  console.error('🚨 CRITICAL: Missing environment variables!');
  console.error('Please check your .env.local file and hosting provider settings.');
  console.error('See NUCLEAR_DEPLOYMENT_GUIDE.md for complete fix instructions.');
// Safe environment access
const env = (typeof import !== 'undefined' && import.meta?.env) || {};

// Export for use in other modules
export const buildTimeEnvCheck = {
  supabaseUrl: env.VITE_SUPABASE_URL,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
  isValid: allVarsPresent
};

export default buildTimeEnvCheck;