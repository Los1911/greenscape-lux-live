/**
 * Multi-Environment Configuration Manager
 * Handles different environment variable requirements for dev, staging, and production
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  required: string[];
  optional: string[];
  validationRules: Record<string, (value: string) => boolean>;
  errorMessages: Record<string, string>;
  placeholderPatterns: string[];
}

export interface ValidationResult {
  isValid: boolean;
  environment: Environment;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  invalidValues: Record<string, string>;
  placeholderValues: Record<string, string>;
}

const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  development: {
    required: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ],
    optional: [
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
      'VITE_RESEND_API_KEY'
    ],
    validationRules: {
      VITE_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('supabase'),
      VITE_SUPABASE_ANON_KEY: (value) => value.length > 100,
      VITE_STRIPE_PUBLISHABLE_KEY: (value) => value.startsWith('pk_test_') || value === '',
      VITE_GOOGLE_MAPS_API_KEY: (value) => value.length > 20 || value === ''
    },
    errorMessages: {
      VITE_SUPABASE_URL: 'Must be a valid Supabase URL starting with https://',
      VITE_SUPABASE_ANON_KEY: 'Must be a valid Supabase anonymous key (100+ chars)',
      VITE_STRIPE_PUBLISHABLE_KEY: 'Must be a test key starting with pk_test_ in development',
      VITE_GOOGLE_MAPS_API_KEY: 'Must be a valid Google Maps API key'
    },
    placeholderPatterns: [
      'your_', 'YOUR_', 'placeholder', 'PLACEHOLDER', 'replace_me', 'REPLACE_ME',
      'sk_test_123', 'pk_test_123', 'example.com', 'localhost:3000'
    ]
  },
  staging: {
    required: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY'
    ],
    optional: [
      'VITE_GOOGLE_MAPS_API_KEY',
      'VITE_RESEND_API_KEY'
    ],
    validationRules: {
      VITE_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('supabase'),
      VITE_SUPABASE_ANON_KEY: (value) => value.length > 100,
      VITE_STRIPE_PUBLISHABLE_KEY: (value) => value.startsWith('pk_test_'),
      VITE_GOOGLE_MAPS_API_KEY: (value) => value.length > 20
    },
    errorMessages: {
      VITE_SUPABASE_URL: 'Must be a valid Supabase URL for staging environment',
      VITE_SUPABASE_ANON_KEY: 'Must be a valid Supabase anonymous key for staging',
      VITE_STRIPE_PUBLISHABLE_KEY: 'Must be a Stripe test key for staging (pk_test_)',
      VITE_GOOGLE_MAPS_API_KEY: 'Google Maps API key required for staging'
    },
    placeholderPatterns: [
      'your_', 'YOUR_', 'placeholder', 'PLACEHOLDER', 'replace_me', 'REPLACE_ME',
      'sk_test_123', 'pk_test_123', 'example.com'
    ]
  },
  production: {
    required: [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_GOOGLE_MAPS_API_KEY'
    ],
    optional: [
      'VITE_RESEND_API_KEY'
    ],
    validationRules: {
      VITE_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('supabase'),
      VITE_SUPABASE_ANON_KEY: (value) => value.length > 100,
      VITE_STRIPE_PUBLISHABLE_KEY: (value) => value.startsWith('pk_live_'),
      VITE_GOOGLE_MAPS_API_KEY: (value) => value.length > 20
    },
    errorMessages: {
      VITE_SUPABASE_URL: 'Must be a valid production Supabase URL',
      VITE_SUPABASE_ANON_KEY: 'Must be a valid production Supabase anonymous key',
      VITE_STRIPE_PUBLISHABLE_KEY: 'Must be a live Stripe key for production (pk_live_)',
      VITE_GOOGLE_MAPS_API_KEY: 'Google Maps API key is required in production'
    },
    placeholderPatterns: [
      'your_', 'YOUR_', 'placeholder', 'PLACEHOLDER', 'replace_me', 'REPLACE_ME',
      'sk_test_', 'pk_test_', 'example.com', 'localhost', 'staging'
    ]
  }
};

export class MultiEnvironmentConfigManager {
  private environment: Environment;
  private config: EnvironmentConfig;

  constructor() {
    this.environment = this.detectEnvironment();
    this.config = ENVIRONMENT_CONFIGS[this.environment];
  }

  private detectEnvironment(): Environment {
    // Check for explicit environment variable
    const nodeEnv = import.meta.env.VITE_NODE_ENV || import.meta.env.MODE;
    
    if (nodeEnv === 'production') return 'production';
    if (nodeEnv === 'staging') return 'staging';
    if (nodeEnv === 'development') return 'development';

    // Detect based on URL patterns
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('staging') || hostname.includes('preview')) {
        return 'staging';
      }
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      return 'production';
    }

    // Default to development
    return 'development';
  }

  public getCurrentEnvironment(): Environment {
    return this.environment;
  }

  public validateEnvironment(): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      environment: this.environment,
      errors: [],
      warnings: [],
      missingRequired: [],
      invalidValues: {},
      placeholderValues: {}
    };

    // Check required variables
    for (const varName of this.config.required) {
      const value = import.meta.env[varName];
      
      if (!value) {
        result.missingRequired.push(varName);
        result.errors.push(`Missing required variable: ${varName}`);
        result.isValid = false;
        continue;
      }

      // Check for placeholder values
      if (this.isPlaceholderValue(value)) {
        result.placeholderValues[varName] = value;
        result.errors.push(`${varName} contains placeholder value: ${value}`);
        result.isValid = false;
        continue;
      }

      // Run validation rules
      const validator = this.config.validationRules[varName];
      if (validator && !validator(value)) {
        result.invalidValues[varName] = this.config.errorMessages[varName] || 'Invalid value';
        result.errors.push(`${varName}: ${this.config.errorMessages[varName]}`);
        result.isValid = false;
      }
    }

    // Check optional variables
    for (const varName of this.config.optional) {
      const value = import.meta.env[varName];
      
      if (value) {
        if (this.isPlaceholderValue(value)) {
          result.placeholderValues[varName] = value;
          result.warnings.push(`${varName} contains placeholder value: ${value}`);
        } else {
          const validator = this.config.validationRules[varName];
          if (validator && !validator(value)) {
            result.invalidValues[varName] = this.config.errorMessages[varName] || 'Invalid value';
            result.warnings.push(`${varName}: ${this.config.errorMessages[varName]}`);
          }
        }
      }
    }

    return result;
  }

  private isPlaceholderValue(value: string): boolean {
    return this.config.placeholderPatterns.some(pattern => 
      value.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  public getEnvironmentRequirements(): EnvironmentConfig {
    return { ...this.config };
  }

  public getValidationSummary(): string {
    const result = this.validateEnvironment();
    const lines = [
      `Environment: ${result.environment.toUpperCase()}`,
      `Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`,
      ''
    ];

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach(error => lines.push(`  ❌ ${error}`));
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach(warning => lines.push(`  ⚠️  ${warning}`));
      lines.push('');
    }

    if (result.isValid) {
      lines.push('All environment variables are properly configured! 🎉');
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const multiEnvConfig = new MultiEnvironmentConfigManager();