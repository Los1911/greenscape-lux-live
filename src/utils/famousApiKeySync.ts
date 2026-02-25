// Enhanced Famous API Key Sync with production environment detection
export interface FamousSetupData {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  googleMapsApiKey?: string;
  resendApiKey?: string;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  keysFound: string[];
  errors: string[];
}

export class FamousApiKeySync {
  private static syncStatus: SyncStatus = {
    isRunning: false,
    lastSync: null,
    keysFound: [],
    errors: []
  };

  static getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  static discoverKeys(): FamousSetupData {
    const discovered: FamousSetupData = {};
    
    try {
      // Check localStorage for Famous setup data
      const famousData = localStorage.getItem('famous_setup');
      if (famousData) {
        const parsed = JSON.parse(famousData);
        discovered.supabaseUrl = parsed.supabaseUrl;
        discovered.supabaseAnonKey = parsed.supabaseAnonKey;
        discovered.stripePublishableKey = parsed.stripePublishableKey;
        discovered.stripeSecretKey = parsed.stripeSecretKey;
        discovered.googleMapsApiKey = parsed.googleMapsApiKey;
        discovered.resendApiKey = parsed.resendApiKey;
      }

      // Check for individual keys in localStorage
      const keys = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_STRIPE_PUBLISHABLE_KEY',
        'VITE_STRIPE_SECRET_KEY',
        'VITE_GOOGLE_MAPS_API_KEY',
        'VITE_RESEND_API_KEY'
      ];

      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          const camelKey = key.replace(/^VITE_/, '').toLowerCase()
            .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          (discovered as any)[camelKey] = value;
        }
      });

      // Update found keys list
      this.syncStatus.keysFound = Object.keys(discovered).filter(key => 
        (discovered as any)[key]
      );

    } catch (error) {
      this.syncStatus.errors.push(`Discovery error: ${error}`);
    }

    return discovered;
  }

  static async syncToProduction(): Promise<boolean> {
    // In production, we rely on build-time environment variables
    // This function is mainly for development environment
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
    
    if (isProduction) {
      console.info('🌿 Production environment detected - using build-time environment variables');
      return true;
    }

    try {
      this.syncStatus.isRunning = true;
      this.syncStatus.errors = [];
      
      const discovered = this.discoverKeys();
      const keyCount = Object.keys(discovered).length;
      
      if (keyCount > 0) {
        console.info(`🔑 Discovered ${keyCount} API keys from Famous setup`);
        this.syncStatus.lastSync = new Date();
        return true;
      }
      
      return false;
    } catch (error) {
      this.syncStatus.errors.push(`Sync error: ${error}`);
      return false;
    } finally {
      this.syncStatus.isRunning = false;
    }
  }

  static validateProductionConfig(): { isValid: boolean; message: string } {
    // Check if we're in production and have proper environment variables
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'));
    
    if (!isProduction) {
      return { isValid: true, message: 'Development environment' };
    }

    // In production, check if environment variables are available
    const hasSupabaseUrl = typeof import.meta !== 'undefined' && 
      import.meta.env?.VITE_SUPABASE_URL;
    const hasSupabaseKey = typeof import.meta !== 'undefined' && 
      import.meta.env?.VITE_SUPABASE_ANON_KEY;

    if (hasSupabaseUrl && hasSupabaseKey) {
      return { isValid: true, message: 'Production environment variables detected' };
    }

    return { 
      isValid: false, 
      message: 'Production deployment missing environment variables. Using fallback configuration.' 
    };
  }
}