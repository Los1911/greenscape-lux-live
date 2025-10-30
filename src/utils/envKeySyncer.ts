// Environment Key Syncer - Helps sync API keys from various sources
export interface APIKeySource {
  name: string;
  keys: Record<string, string>;
  source: 'localStorage' | 'queryParams' | 'config' | 'env';
}

export class EnvKeySyncer {
  private static instance: EnvKeySyncer;
  
  static getInstance(): EnvKeySyncer {
    if (!EnvKeySyncer.instance) {
      EnvKeySyncer.instance = new EnvKeySyncer();
    }
    return EnvKeySyncer.instance;
  }

  // Check for API keys in localStorage (from Famous setup)
  checkLocalStorage(): APIKeySource {
    const keys: Record<string, string> = {};
    
    try {
      // Check for Supabase keys
      const supabaseUrl = localStorage.getItem('GSL_SUPABASE_URL') || localStorage.getItem('supabaseUrl');
      const supabaseAnon = localStorage.getItem('GSL_SUPABASE_ANON') || localStorage.getItem('supabaseAnonKey');
      
      if (supabaseUrl) keys.VITE_SUPABASE_URL = supabaseUrl;
      if (supabaseAnon) keys.VITE_SUPABASE_PUBLISHABLE_KEY = supabaseAnon;

      // Check for other API keys that might be stored
      const stripeKey = localStorage.getItem('STRIPE_PUBLISHABLE_KEY') || localStorage.getItem('GSL_STRIPE_KEY');
      const googleMapsKey = localStorage.getItem('GOOGLE_MAPS_API_KEY') || localStorage.getItem('GSL_MAPS_KEY');
      const resendKey = localStorage.getItem('RESEND_API_KEY') || localStorage.getItem('GSL_RESEND_KEY');
      
      if (stripeKey) keys.VITE_STRIPE_PUBLISHABLE_KEY = stripeKey;
      if (googleMapsKey) keys.VITE_GOOGLE_MAPS_API_KEY = googleMapsKey;
      if (resendKey) keys.VITE_RESEND_API_KEY = resendKey;
      
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
    
    return {
      name: 'localStorage',
      keys,
      source: 'localStorage'
    };
  }

  // Check for API keys in URL parameters
  checkQueryParams(): APIKeySource {
    const keys: Record<string, string> = {};
    
    try {
      const params = new URLSearchParams(window.location.search);
      
      // Check for encoded config
      const sb = params.get('sb');
      if (sb) {
        try {
          const decoded = atob(sb);
          const [url, anon] = decoded.split('|');
          if (url) keys.VITE_SUPABASE_URL = url;
          if (anon) keys.VITE_SUPABASE_PUBLISHABLE_KEY = anon;
        } catch (e) {
          console.warn('Failed to decode sb parameter');
        }
      }
      
      // Check individual parameters
      const directUrl = params.get('supabase_url');
      const directAnon = params.get('supabase_anon');
      const stripeKey = params.get('stripe_key');
      const mapsKey = params.get('maps_key');
      
      if (directUrl) keys.VITE_SUPABASE_URL = directUrl;
      if (directAnon) keys.VITE_SUPABASE_PUBLISHABLE_KEY = directAnon;
      if (stripeKey) keys.VITE_STRIPE_PUBLISHABLE_KEY = stripeKey;
      if (mapsKey) keys.VITE_GOOGLE_MAPS_API_KEY = mapsKey;
      
    } catch (error) {
      console.error('Error checking query params:', error);
    }
    
    return {
      name: 'queryParams',
      keys,
      source: 'queryParams'
    };
  }

  // Get all available API key sources
  getAllSources(): APIKeySource[] {
    return [
      this.checkLocalStorage(),
      this.checkQueryParams()
    ];
  }

  // Generate .env.local content with discovered keys
  generateEnvContent(): string {
    const sources = this.getAllSources();
    const mergedKeys: Record<string, string> = {};
    
    // Merge keys from all sources (localStorage takes priority)
    sources.forEach(source => {
      Object.assign(mergedKeys, source.keys);
    });
    
    // Start with template content
    let content = `# Supabase Configuration
# For Vercel deployment, add these exact values as environment variables:
VITE_SUPABASE_URL=${mergedKeys.VITE_SUPABASE_URL || 'https://mwvcbedvnimabfwubazz.supabase.co'}
VITE_SUPABASE_PUBLISHABLE_KEY=${mergedKeys.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY'}
VITE_SUPABASE_FUNCTIONS_URL=https://mwvcbedvnimabfwubazz.functions.supabase.co
VITE_SITE_URL=https://greenscapelux.com

# Admin Email Configuration
VITE_ADMIN_EMAIL=cmatthews@greenscapelux.com

# Development Settings
VITE_APP_ENV=development


# Stripe Configuration (Required for payments)
# Get these from https://dashboard.stripe.com/apikeys
VITE_STRIPE_PUBLISHABLE_KEY=${mergedKeys.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here'}
VITE_STRIPE_SECRET_KEY=${mergedKeys.VITE_STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here'}
VITE_STRIPE_WEBHOOK_SECRET=${mergedKeys.VITE_STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here'}

# Google Maps API (Required for location services)
# Get from https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_MAPS_API_KEY=${mergedKeys.VITE_GOOGLE_MAPS_API_KEY || 'your-google-maps-api-key-here'}

# Resend Email API (Optional for notifications)
# Get from https://resend.com/api-keys
VITE_RESEND_API_KEY=${mergedKeys.VITE_RESEND_API_KEY || 're_your_resend_api_key_here'}`;

    return content;
  }

  // Report on discovered keys
  generateReport(): string {
    const sources = this.getAllSources();
    let report = '🔍 API Key Discovery Report\n';
    report += '=' .repeat(50) + '\n\n';
    
    sources.forEach(source => {
      const keyCount = Object.keys(source.keys).length;
      report += `📍 ${source.name} (${keyCount} keys found):\n`;
      
      if (keyCount === 0) {
        report += '  No API keys found\n\n';
      } else {
        Object.entries(source.keys).forEach(([key, value]) => {
          const masked = value.length > 10 ? 
            `${value.slice(0, 6)}...${value.slice(-4)}` : 
            value;
          report += `  ✓ ${key}: ${masked}\n`;
        });
        report += '\n';
      }
    });
    
    return report;
  }
}