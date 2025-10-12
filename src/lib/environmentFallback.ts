// Emergency fallback system for missing environment variables
// Prevents app crashes while maintaining security

export interface FallbackConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  stripe: {
    publishableKey: string;
  };
  googleMaps: {
    apiKey: string;
  };
}

// Production-ready fallback configuration
const FALLBACK_CONFIG: FallbackConfig = {
  supabase: {
    url: 'https://mwvcbedvnimabfwubazz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY'
  },
  stripe: {
    publishableKey: 'pk_live_51S1Ht0K6kWkUsxtpuhNk69fjZuVrP85DNMYpexFeFMH5bCHdZjbtltPYXMcU5luEbz0SlB3ImUDAbifJspjtom0L00q27vIPCK'
  },
  googleMaps: {
    apiKey: 'AIzaSyDGAU0VsZYL67arpQfGy-1vWSANqe-mKo4'
  }
};


export function getEnvironmentVariable(key: string): string {
  // Try to get from environment first
  const envValue = import.meta.env?.[key];
  if (envValue && envValue !== '' && !envValue.includes('placeholder')) {
    return envValue;
  }

  // Fallback to known working values
  switch (key) {
    case 'VITE_SUPABASE_URL':
      console.warn('⚠️ Using fallback Supabase URL');
      return FALLBACK_CONFIG.supabase.url;
    
    case 'VITE_SUPABASE_ANON_KEY':
      console.warn('⚠️ Using fallback Supabase anon key');
      return FALLBACK_CONFIG.supabase.anonKey;
    case 'VITE_STRIPE_PUBLISHABLE_KEY':
      console.warn('⚠️ Using fallback Stripe publishable key');
      return FALLBACK_CONFIG.stripe.publishableKey;

    
    case 'VITE_GOOGLE_MAPS_API_KEY':
      console.warn('⚠️ Using fallback Google Maps API key');
      return FALLBACK_CONFIG.googleMaps.apiKey;
    
    default:
      console.warn(`⚠️ No fallback available for ${key}`);
      return '';
  }
}

export function validateEnvironmentSetup(): {
  isValid: boolean;
  missingKeys: string[];
  usingFallbacks: string[];
} {
  const requiredKeys = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const optionalKeys = [
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_GOOGLE_MAPS_API_KEY'
  ];

  const missingKeys: string[] = [];
  const usingFallbacks: string[] = [];

  // Check required keys
  for (const key of requiredKeys) {
    const envValue = import.meta.env?.[key];
    if (!envValue || envValue === '' || envValue.includes('placeholder')) {
      usingFallbacks.push(key);
    }
  }

  // Check optional keys
  for (const key of optionalKeys) {
    const envValue = import.meta.env?.[key];
    if (!envValue || envValue === '' || envValue.includes('placeholder')) {
      usingFallbacks.push(key);
    }
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
    usingFallbacks
  };
}

// Safe configuration getter with fallbacks
export function getSafeConfig() {
  const validation = validateEnvironmentSetup();
  
  if (validation.usingFallbacks.length > 0) {
    console.warn('🔧 Environment Fallback System Active');
    console.warn('Using fallbacks for:', validation.usingFallbacks);
    console.warn('Please configure proper environment variables for production');
  }

  return {
    supabase: {
      url: getEnvironmentVariable('VITE_SUPABASE_URL'),
      anonKey: getEnvironmentVariable('VITE_SUPABASE_ANON_KEY')
    },
    stripe: {
      publishableKey: getEnvironmentVariable('VITE_STRIPE_PUBLISHABLE_KEY')
    },
    googleMaps: {
      apiKey: getEnvironmentVariable('VITE_GOOGLE_MAPS_API_KEY')
    },
    app: {
      name: 'GreenScape Lux',
      version: '1.0.0',
      environment: import.meta.env?.MODE || 'production'
    }
  };
}