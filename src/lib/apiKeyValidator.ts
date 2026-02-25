// API Key validation system for GreenScape Lux
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  service: string;
  key: string;
  isPlaceholder?: boolean;
}

export interface ValidationSummary {
  allValid: boolean;
  errors: string[];
  warnings: string[];
  criticalMissing: string[];
  placeholderKeys: string[];
}

// Known placeholder patterns to detect
const PLACEHOLDER_PATTERNS = [
  'your-key',
  'your_key_here',
  'your-project',
  'your_publishable_key_here',
  'your_secret_key_here',
  'your_webhook_secret_here',
  'your_resend_api_key_here',
  'example-key',
  'test-key',
  'placeholder',
  'pk_test_your_publishable_key_here',
  'sk_test_your_secret_key_here',
  'sk_live_your_secret_key_here',
];

export class APIKeyValidator {
  static validateSupabaseUrl(url: string): ValidationResult {
    const service = 'Supabase URL';
    
    if (!url || url.trim() === '') {
      return { isValid: false, error: 'Supabase URL is required', service, key: url };
    }

    if (this.isPlaceholder(url)) {
      return { 
        isValid: false, 
        error: 'Supabase URL contains placeholder value', 
        service, 
        key: url,
        isPlaceholder: true 
      };
    }

    if (!url.includes('.supabase.co')) {
      return { 
        isValid: false, 
        error: 'Invalid Supabase URL format (must contain .supabase.co)', 
        service, 
        key: url 
      };
    }

    return { isValid: true, service, key: url };
  }

  static validateSupabasePublishableKey(key: string): ValidationResult {
    const service = 'Supabase Publishable Key';
    
    if (!key || key.trim() === '') {
      return { isValid: false, error: 'Supabase publishable key is required', service, key };
    }

    if (this.isPlaceholder(key)) {
      return { 
        isValid: false, 
        error: 'Supabase publishable key contains placeholder value', 
        service, 
        key,
        isPlaceholder: true 
      };
    }

    return { isValid: true, service, key };
  }

  static validateStripePublishableKey(key: string): ValidationResult {
    const service = 'Stripe Publishable Key';
    
    if (!key || key.trim() === '') {
      return { isValid: true, service, key }; // Optional
    }

    if (this.isPlaceholder(key)) {
      return { 
        isValid: false, 
        error: 'Stripe publishable key contains placeholder value', 
        service, 
        key,
        isPlaceholder: true 
      };
    }

    if (!key.startsWith('pk_')) {
      return { 
        isValid: false, 
        error: 'Invalid Stripe publishable key format (must start with pk_)', 
        service, 
        key 
      };
    }

    return { isValid: true, service, key };
  }

  static validateGoogleMapsKey(key: string): ValidationResult {
    const service = 'Google Maps API Key';
    
    if (!key || key.trim() === '') {
      return { isValid: true, service, key }; // Optional
    }

    if (this.isPlaceholder(key)) {
      return { 
        isValid: false, 
        error: 'Google Maps API key contains placeholder value', 
        service, 
        key,
        isPlaceholder: true 
      };
    }

    if (!key.startsWith('AIza')) {
      return { 
        isValid: false, 
        error: 'Invalid Google Maps API key format (must start with AIza)', 
        service, 
        key 
      };
    }

    return { isValid: true, service, key };
  }

  static isPlaceholder(value: string): boolean {
    if (!value || value.trim() === '') return false;
    
    const lowerValue = value.toLowerCase();
    return PLACEHOLDER_PATTERNS.some(pattern => 
      lowerValue.includes(pattern.toLowerCase())
    );
  }

  static validateAllKeys(config: any): ValidationSummary {
    const results: ValidationResult[] = [
      this.validateSupabaseUrl(config.supabase?.url),
      this.validateSupabasePublishableKey(config.supabase?.publishableKey),
      this.validateStripePublishableKey(config.stripe?.publishableKey),
      this.validateGoogleMapsKey(config.googleMaps?.apiKey),
    ];

    const errors = results.filter(r => !r.isValid).map(r => `${r.service}: ${r.error}`);
    const warnings: string[] = [];
    const criticalMissing = results
      .filter(r => !r.isValid && (!r.key || r.key.trim() === ''))
      .map(r => r.service);
    const placeholderKeys = results
      .filter(r => r.isPlaceholder)
      .map(r => r.service);

    return {
      allValid: errors.length === 0,
      errors,
      warnings,
      criticalMissing,
      placeholderKeys
    };
  }
}
