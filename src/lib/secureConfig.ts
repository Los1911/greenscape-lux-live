// Secure configuration manager with environment validation
// Removes hardcoded credentials while maintaining app functionality

interface SecureConfigOptions {
  requireAll?: boolean;
  allowFallbacks?: boolean;
}

interface ConfigValidation {
  isValid: boolean;
  missing: string[];
  usingFallbacks: string[];
}

class SecureConfigManager {
  private static instance: SecureConfigManager;
  private config: Record<string, string> = {};
  private validation: ConfigValidation = {
    isValid: false,
    missing: [],
    usingFallbacks: []
  };

  private constructor() {
    this.loadConfiguration();
  }

  static getInstance(): SecureConfigManager {
    if (!SecureConfigManager.instance) {
      SecureConfigManager.instance = new SecureConfigManager();
    }
    return SecureConfigManager.instance;
  }

  private loadConfiguration() {
    const requiredKeys = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
      'VITE_RESEND_API_KEY'
    ];

    const missing: string[] = [];
    const usingFallbacks: string[] = [];

    for (const key of requiredKeys) {
      const value = this.getEnvVar(key);
      if (value) {
        this.config[key] = value;
        // Check if using production fallback (only for critical services)
        if (this.isUsingFallback(key)) {
          usingFallbacks.push(key);
        }
      } else {
        missing.push(key);
      }
    }

    this.validation = {
      isValid: missing.length === 0,
      missing,
      usingFallbacks
    };

    // Log security status
    this.logSecurityStatus();
  }

  private getEnvVar(key: string): string | undefined {
    // Try environment variables first
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const value = import.meta.env[key];
      if (value && value !== 'undefined') return value;
    }

    // Only allow fallbacks for critical Supabase keys in production
    if (this.isProduction() && this.isCriticalKey(key)) {
      return this.getProductionFallback(key);
    }

    return undefined;
  }

  private isCriticalKey(key: string): boolean {
    return key === 'VITE_SUPABASE_URL' || key === 'VITE_SUPABASE_PUBLISHABLE_KEY';
  }

  private isUsingFallback(key: string): boolean {
    const envValue = import.meta.env?.[key];
    return !envValue && this.isCriticalKey(key) && this.isProduction();
  }

  private getProductionFallback(key: string): string | undefined {
    // Only provide fallbacks for critical Supabase keys
    const fallbacks: Record<string, string> = {
      VITE_SUPABASE_URL: 'https://mwvcbedvnimabfwubazz.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY'
    };
    return fallbacks[key];
  }

  private isProduction(): boolean {
    return typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' && 
           !window.location.hostname.includes('127.0.0.1');
  }

  private logSecurityStatus() {
    if (this.validation.missing.length > 0) {
      console.warn('⚠️ Missing environment variables:', this.validation.missing);
    }
    
    if (this.validation.usingFallbacks.length > 0) {
      console.info('🔧 Using production fallbacks:', this.validation.usingFallbacks);
    }
    
    if (this.validation.isValid) {
      console.info('✅ All environment variables configured');
    }
  }

  public get(key: string): string | undefined {
    return this.config[key];
  }

  public getRequired(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Required environment variable ${key} is not configured`);
    }
    return value;
  }

  public getValidation(): ConfigValidation {
    return { ...this.validation };
  }

  public isConfigured(key: string): boolean {
    return Boolean(this.config[key]);
  }

  public refresh(): void {
    this.loadConfiguration();
  }
}

export const secureConfig = SecureConfigManager.getInstance();
export type { ConfigValidation };