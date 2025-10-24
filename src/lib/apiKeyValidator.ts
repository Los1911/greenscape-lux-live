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
  'pk_test_your_publishable_key_here', // Specific placeholder from template
  'sk_test_your_secret_key_here',      // Specific placeholder from template
  'sk_live_your_secret_key_here',      // Live secret key placeholder
  // DO NOT include the real live key as a placeholder
];

// Add validation for Stripe secret key (backend only)
export function validateStripeSecretKey(key: string): ValidationResult {
  const service = 'Stripe Secret Key';
  
  if (!key || key.trim() === '') {
    return { isValid: false, error: 'Stripe secret key is required for backend operations', service, key };
  }

  if (APIKeyValidator.isPlaceholder(key)) {
    return { 
      isValid: false, 
      error: 'Stripe secret key contains placeholder value', 
      service, 
      key,
      isPlaceholder: true 
    };
  }

  if (!key.startsWith('sk_')) {
    return { 
      isValid: false, 
      error: 'Invalid Stripe secret key format (must start with sk_)', 
      service, 
      key 
    };
  }

  return { isValid: true, service, key };
}

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

  static validateSupabaseAnonKey(key: string): ValidationResult {
    const service = 'Supabase Anon Key';
    
    if (!key || key.trim() === '') {
      return { isValid: false, error: 'Supabase anon key is required', service, key };
    }

    if (this.isPlaceholder(key)) {
      return { 
        isValid: false, 
        error: 'Supabase anon key contains placeholder value', 
        service, 
        key,
        isPlaceholder: true 
      };
    }

    if (!key.startsWith('eyJ')) {
      return { 
        isValid: false, 
        error: 'Invalid Supabase anon key format (must be JWT)', 
        service, 
        key 
      };
    }

    return { isValid: true, service, key };
  }

  static validateStripePublishableKey(key: string): ValidationResult {
    const service = 'Stripe Publishable Key';
    
    if (!key || key.trim() === '') {
      return { isValid: true, service, key }; // Make optional to prevent errors
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
      return { isValid: false, error: 'Google Maps API key is required for location services', service, key };
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

  static validateResendKey(key: string): ValidationResult {
    const service = 'Resend API Key';
    
    if (!key || key.trim() === '') {
      return { isValid: true, service, key }; // Optional service
    }

    if (this.isPlaceholder(key)) {
      return { 
        isValid: false, 
        error: 'Resend API key contains placeholder value', 
        service, 
        key,
        isPlaceholder: true 
      };
    }

    if (!key.startsWith('re_')) {
      return { 
        isValid: false, 
        error: 'Invalid Resend API key format (must start with re_)', 
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
      this.validateSupabaseAnonKey(config.supabase?.anonKey),
      this.validateStripePublishableKey(config.stripe?.publishableKey),
      this.validateGoogleMapsKey(config.googleMaps?.apiKey),
      this.validateResendKey(config.resend?.apiKey)
    ];

    const errors = results.filter(r => !r.isValid).map(r => `${r.service}: ${r.error}`);
    const warnings: string[] = [];
    const criticalMissing = results
      .filter(r => !r.isValid && (!r.key || r.key.trim() === '') && r.service !== 'Resend API Key')
      .map(r => r.service);
    const placeholderKeys = results
      .filter(r => r.isPlaceholder)
      .map(r => r.service);

    // Add warnings for optional services
    if (!config.resend?.apiKey || config.resend.apiKey.trim() === '') {
      warnings.push('Resend API key not configured - email notifications will be limited');
    }

    return {
      allValid: errors.length === 0,
      errors,
      warnings,
      criticalMissing,
      placeholderKeys
    };
  }
}