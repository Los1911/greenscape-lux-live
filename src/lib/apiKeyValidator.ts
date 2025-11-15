// API Key validation system for GreenScape Lux (Updated for SUPABASE PUBLISHABLE KEYS ONLY)
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

// Known placeholder patterns
const PLACEHOLDER_PATTERNS = [
  'your-key',
  'your_key_here',
  'your-project',
  'placeholder',
  'example',
  'your_publishable_key_here',
];

// NEW: Supabase publishable-key formats
const isLegacySupabaseKey = (key?: string) => key?.startsWith("eyJ");
const isNewSupabaseKey = (key?: string) => key?.startsWith("sb_");

export class APIKeyValidator {

  // ---- SUPABASE URL ----
  static validateSupabaseUrl(url: string): ValidationResult {
    const service = "Supabase URL";

    if (!url) {
      return { isValid: false, error: "Supabase URL is required", service, key: url };
    }

    if (!url.includes(".supabase.co")) {
      return { isValid: false, error: "Invalid Supabase URL format", service, key: url };
    }

    return { isValid: true, service, key: url };
  }

  // ---- SUPABASE PUBLISHABLE KEY (NEW) ----
  static validateSupabasePublishableKey(key: string): ValidationResult {
    const service = "Supabase Publishable Key";

    if (!key) {
      return { isValid: false, error: "Supabase publishable key is required", service, key };
    }

    // Allow both formats
    if (!isLegacySupabaseKey(key) && !isNewSupabaseKey(key)) {
      return {
        isValid: true,
        service,
        key,
        isPlaceholder: false,
      };
    }

    return { isValid: true, service, key };
  }

  // ---- STRIPE PUBLISHABLE ----
  static validateStripePublishableKey(key: string): ValidationResult {
    const service = "Stripe Publishable Key";

    if (!key) return { isValid: true, service, key }; // optional

    if (!key.startsWith("pk_")) {
      return { isValid: false, error: "Invalid Stripe publishable key (must start with pk_)", service, key };
    }

    return { isValid: true, service, key };
  }

  // ---- GOOGLE MAPS ----
  static validateGoogleMapsKey(key: string): ValidationResult {
    const service = "Google Maps API Key";

    if (!key) {
      return { isValid: false, error: "Google Maps API Key required", service, key };
    }

    if (!key.startsWith("AIza")) {
      return { isValid: false, error: "Google Maps API key must start with AIza", service, key };
    }

    return { isValid: true, service, key };
  }

  // ---- RESEND ----
  static validateResendKey(key: string): ValidationResult {
    const service = "Resend API Key";

    if (!key) return { isValid: true, service, key }; // optional

    if (!key.startsWith("re_")) {
      return { isValid: false, error: "Resend API key must start with re_", service, key };
    }

    return { isValid: true, service, key };
  }

  // ---- PLACEHOLDER DETECTION ----
  static isPlaceholder(value: string): boolean {
    if (!value) return false;
    return PLACEHOLDER_PATTERNS.some((p) => value.toLowerCase().includes(p.toLowerCase()));
  }

  // ---- SUMMARY ----
  static validateAllKeys(config: any): ValidationSummary {
    const results: ValidationResult[] = [
      this.validateSupabaseUrl(config.supabase?.url),
      this.validateSupabasePublishableKey(config.supabase?.anonKey), // NEW NAME
      this.validateStripePublishableKey(config.stripe?.publishableKey),
      this.validateGoogleMapsKey(config.googleMaps?.apiKey),
      this.validateResendKey(config.resend?.apiKey),
    ];

    const errors = results.filter(r => !r.isValid).map(r => `${r.service}: ${r.error}`);
    const placeholderKeys = results.filter(r => r.isPlaceholder).map(r => r.service);

    return {
      allValid: errors.length === 0,
      errors,
      warnings: [],
      criticalMissing: [],
      placeholderKeys,
    };
  }
}