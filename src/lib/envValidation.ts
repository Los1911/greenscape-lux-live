// Comprehensive Environment Variable Validation System
// Validates all VITE_ variables at build time and runtime
// Detects placeholder values and provides clear error messages

export interface EnvVariable {
  key: string;
  description: string;
  required: boolean;
  validator?: (value: string) => boolean;
  example?: string;
  placeholder?: string[];
}

// Frontend environment variables (VITE_ prefixed)
export const FRONTEND_ENV_VARS: EnvVariable[] = [
  {
    key: 'VITE_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
    validator: (val) => val.includes('supabase.co') && val.startsWith('https://'),
    example: 'https://your-project.supabase.co',
    placeholder: ['your_supabase_project_url', 'your-project', 'placeholder']
  },
  {
    key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
    description: 'Supabase publishable key (formerly anon key)',
    required: true,
    validator: (val) => val.startsWith('eyJ') && val.length > 100,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    placeholder: ['your_supabase_publishable_key', 'your_supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9']
  },

  {
    key: 'VITE_STRIPE_PUBLISHABLE_KEY',
    description: 'Stripe publishable key',
    required: true,
    validator: (val) => val.startsWith('pk_') && (val.includes('live_') || val.includes('test_')),
    example: 'pk_live_... or pk_test_...',
    placeholder: ['pk_test_your_stripe_publishable_key', 'your_stripe_publishable_key']
  },
  {
    key: 'VITE_SITE_URL',
    description: 'Site URL for redirects and links',
    required: true,
    validator: (val) => val.startsWith('http') && !val.endsWith('/'),
    example: 'https://yoursite.com',
    placeholder: ['https://yoursite.com', 'your_site_url']
  },
  {
    key: 'VITE_GOOGLE_MAPS_API_KEY',
    description: 'Google Maps API key',
    required: false,
    validator: (val) => val.startsWith('AIza') && val.length > 30,
    example: 'AIzaSyDGAU0VsZYL67arpQfGy...',
    placeholder: ['your_google_maps_api_key', 'AIzaSy']
  },
  {
    key: 'VITE_ADMIN_EMAIL',
    description: 'Admin email address',
    required: false,
    validator: (val) => val.includes('@') && val.includes('.'),
    example: 'admin@yoursite.com',
    placeholder: ['admin@yoursite.com', 'your_admin_email']
  },
  {
    key: 'VITE_APP_ENV',
    description: 'Application environment',
    required: false,
    validator: (val) => ['development', 'staging', 'production'].includes(val),
    example: 'production'
  }
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  placeholderValues: string[];
  invalidFormats: string[];
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  
  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  validateAll(): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingRequired: [],
      placeholderValues: [],
      invalidFormats: []
    };

    for (const envVar of FRONTEND_ENV_VARS) {
      this.validateSingle(envVar, result);
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  private validateSingle(envVar: EnvVariable, result: ValidationResult): void {
    const value = this.getEnvValue(envVar.key);

    // Check if required variable is missing
    if (envVar.required && (!value || value.trim() === '')) {
      result.errors.push(`❌ ${envVar.key} is required but not set`);
      result.errors.push(`   Description: ${envVar.description}`);
      if (envVar.example) {
        result.errors.push(`   Example: ${envVar.example}`);
      }
      result.missingRequired.push(envVar.key);
      return;
    }

    // Skip validation if optional and not set
    if (!envVar.required && (!value || value.trim() === '')) {
      return;
    }

    if (value) {
      // Check for placeholder values
      if (this.isPlaceholderValue(value, envVar.placeholder)) {
        result.errors.push(`❌ ${envVar.key} contains placeholder value`);
        result.errors.push(`   Description: Replace with actual value`);
        result.errors.push(`   Current value: ${value.substring(0, 50)}...`);
        if (envVar.example) {
          result.errors.push(`   Example: ${envVar.example}`);
        }
        result.placeholderValues.push(envVar.key);
        return;
      }

      // Check format validation
      if (envVar.validator && !envVar.validator(value)) {
        result.errors.push(`❌ ${envVar.key} has invalid format`);
        result.errors.push(`   Description: ${envVar.description}`);
        if (envVar.example) {
          result.errors.push(`   Example: ${envVar.example}`);
        }
        result.invalidFormats.push(envVar.key);
        return;
      }

      // Success case
      result.warnings.push(`✅ ${envVar.key}: Valid`);
    }
  }

  private getEnvValue(key: string): string | undefined {
    // Only use import.meta.env for frontend variables
    if (typeof window !== 'undefined' && import.meta?.env) {
      return import.meta.env[key];
    }
    return undefined;
  }
  private isPlaceholderValue(value: string, placeholders?: string[]): boolean {
    if (!placeholders) return false;
    
    const lowerValue = value.toLowerCase();
    return placeholders.some(placeholder => 
      lowerValue.includes(placeholder.toLowerCase()) ||
      value.includes('your_') ||
      value.includes('placeholder') ||
      value.includes('REPLACE') ||
      value.includes('TODO')
    );
  }

  // Build-time validation (throws errors to fail build)
  validateBuildTime(): void {
    const result = this.validateAll();
    
    if (!result.valid) {
      console.error('\n🚨 ENVIRONMENT VARIABLE VALIDATION FAILED 🚨\n');
      
      result.errors.forEach(error => console.error(error));
      
      console.error('\n📋 Required Environment Variables:');
      FRONTEND_ENV_VARS
        .filter(env => env.required)
        .forEach(env => {
          console.error(`  ${env.key}: ${env.description}`);
          if (env.example) {
            console.error(`    Example: ${env.example}`);
          }
        });
      
      console.error('\n💡 Fix these issues and rebuild the application.\n');
      throw new Error('Environment validation failed - build cannot continue');
    }
    
    console.log('✅ All environment variables validated successfully');
  }

  // Runtime validation (logs warnings but doesn't crash)
  validateRuntime(): ValidationResult {
    const result = this.validateAll();
    
    if (!result.valid) {
      console.warn('\n⚠️ Environment Variable Issues Detected:\n');
      result.errors.forEach(error => console.warn(error));
    } else {
      console.log('✅ All environment variables are valid');
    }
    
    return result;
  }

  // Get environment info for debugging
  getEnvironmentInfo(): Record<string, any> {
    const info: Record<string, any> = {
      mode: import.meta.env?.MODE || 'unknown',
      dev: import.meta.env?.DEV || false,
      prod: import.meta.env?.PROD || false,
      variables: {}
    };

    FRONTEND_ENV_VARS.forEach(envVar => {
      const value = this.getEnvValue(envVar.key);
      info.variables[envVar.key] = {
        set: !!value,
        required: envVar.required,
        valid: value ? (envVar.validator ? envVar.validator(value) : true) : false,
        placeholder: value ? this.isPlaceholderValue(value, envVar.placeholder) : false
      };
    });

    return info;
  }
}

// Singleton instance
export const envValidator = EnvironmentValidator.getInstance();