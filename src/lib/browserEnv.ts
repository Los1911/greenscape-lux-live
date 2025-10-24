// Browser-safe environment variable access
// Eliminates all process.env references that cause "Can't find variable: process" errors

export function getBrowserEnv(key: string): string | undefined {
  // Production-safe environment variable access
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (value && value.trim() !== '') {
      return value.trim();
    }
  }
  
  // Fallback for edge cases where import.meta is not available
  if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
    const value = (window as any).import.meta.env[key];
    if (value && value.trim() !== '') {
      return value.trim();
    }
  }
  
  // Return undefined if no valid value found
  return undefined;
}

export function isDevelopment(): boolean {
  return import.meta.env?.DEV === true;
}

export function isProduction(): boolean {
  return import.meta.env?.PROD === true;
}

// Debug helper to show all available environment variables
export function debugEnvironmentVariables(): void {
  if (!isDevelopment()) {
    console.warn('🚫 Environment debug only available in development mode');
    return;
  }
  
  console.group('🔧 Environment Variables Debug');
  console.log('Environment Mode:', isDevelopment() ? 'Development' : isProduction() ? 'Production' : 'Unknown');
  
  const envVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'VITE_STRIPE_PUBLIC_KEY',
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_RESEND_API_KEY'
  ];

  
  envVars.forEach(key => {
    const value = getBrowserEnv(key);
    console.log(`${key}:`, value ? '✅ Set' : '❌ Missing');
    if (value && isDevelopment()) {
      console.log(`  Value: ${value.substring(0, 20)}...`);
    }
  });
  
  console.groupEnd();
}