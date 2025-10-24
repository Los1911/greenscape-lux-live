// Environment guard system - validates configuration at startup
import { APIKeyValidator, ValidationSummary } from './apiKeyValidator';
import { config } from './config';

export interface EnvironmentGuardConfig {
  strictMode: boolean;
  allowPlaceholders: boolean;
  requiredServices: string[];
  routeType?: 'admin' | 'client' | 'landscaper' | 'public';
}

export class EnvironmentGuard {
  private static instance: EnvironmentGuard;
  private validation: ValidationSummary | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EnvironmentGuard {
    if (!EnvironmentGuard.instance) {
      EnvironmentGuard.instance = new EnvironmentGuard();
    }
    return EnvironmentGuard.instance;
  }

  // Route-aware initialization
  async initializeForRoute(currentPath?: string, guardConfig?: Partial<EnvironmentGuardConfig>): Promise<ValidationSummary> {
    const routeType = this.determineRouteType(currentPath);
    
    const defaultConfig: EnvironmentGuardConfig = {
      strictMode: routeType === 'admin' && config.app.environment === 'production',
      allowPlaceholders: config.app.environment === 'development',
      requiredServices: this.getRequiredServicesForRoute(routeType),
      routeType
    };

    const finalConfig = { ...defaultConfig, ...guardConfig };
    
    console.log(`🔒 EnvironmentGuard: Initializing for ${routeType} route with config:`, finalConfig);
    
    try {
      this.validation = APIKeyValidator.validateAllKeys(config);
      
      // Log validation results
      this.logValidationResults(this.validation, finalConfig);
      
      // Handle validation based on route type
      if (routeType === 'admin') {
        // Strict validation for admin routes
        if (!this.validation.allValid) {
          const criticalErrors = this.validation.errors.filter(error => 
            finalConfig.requiredServices.some(service => error.includes(service))
          );
          
          if (criticalErrors.length > 0) {
            console.error('🚨 Admin route - Critical services missing:', criticalErrors);
            if (finalConfig.strictMode) {
              throw new Error(`Admin dashboard requires: ${criticalErrors.join(', ')}`);
            }
          }
        }
      } else {
        // Relaxed validation for client/landscaper routes
        if (!this.validation.allValid) {
          const criticalErrors = this.validation.errors.filter(error => 
            finalConfig.requiredServices.some(service => error.includes(service))
          );
          
          if (criticalErrors.length > 0) {
            console.warn(`⚠️ ${routeType} route - Some services unavailable:`, criticalErrors);
            console.warn('🔧 App will continue with limited functionality');
          }
        }
      }

      // Handle placeholder detection - only strict for admin routes
      if (!finalConfig.allowPlaceholders && this.validation.placeholderKeys.length > 0) {
        const criticalPlaceholders = this.validation.placeholderKeys.filter(service =>
          finalConfig.requiredServices.includes(service)
        );
        
        if (criticalPlaceholders.length > 0 && routeType === 'admin') {
          throw new Error(`Admin dashboard - Placeholder values detected: ${criticalPlaceholders.join(', ')}`);
        } else if (criticalPlaceholders.length > 0) {
          console.warn(`⚠️ ${routeType} route - Placeholder values found:`, criticalPlaceholders);
        }
      }

      this.isInitialized = true;
      return this.validation;
      
    } catch (error) {
      if (routeType === 'admin') {
        console.error('🚨 EnvironmentGuard: Admin validation failed:', error);
        throw error;
      } else {
        console.warn('⚠️ EnvironmentGuard: Non-admin validation issues (non-blocking):', error);
        // Return a basic validation for non-admin routes
        return this.validation || { allValid: false, errors: [], warnings: [], placeholderKeys: [] };
      }
    }
  }

  // Legacy initialize method for backward compatibility
  async initialize(guardConfig?: Partial<EnvironmentGuardConfig>): Promise<ValidationSummary> {
    return this.initializeForRoute(undefined, guardConfig);
  }

  private determineRouteType(currentPath?: string): 'admin' | 'client' | 'landscaper' | 'public' {
    if (!currentPath) {
      // Try to get current path from window location
      if (typeof window !== 'undefined') {
        currentPath = window.location.pathname;
      }
    }

    if (!currentPath) return 'public';

    if (currentPath.includes('/admin')) return 'admin';
    if (currentPath.includes('/client') || currentPath.includes('/dashboard')) return 'client';
    if (currentPath.includes('/landscaper') || currentPath.includes('/pro')) return 'landscaper';
    return 'public';
  }

  private getRequiredServicesForRoute(routeType: string): string[] {
    switch (routeType) {
      case 'admin':
        // Admin needs all services
        return ['Supabase URL', 'Supabase Anon Key', 'Stripe Publishable Key', 'Google Maps API Key', 'Resend API Key'];
      case 'client':
      case 'landscaper':
        // Client/landscaper only need core services
        return ['Supabase URL', 'Supabase Anon Key'];
      case 'public':
      default:
        // Public routes need minimal services
        return ['Supabase URL', 'Supabase Anon Key'];
    }
  }

  private logValidationResults(validation: ValidationSummary, config: EnvironmentGuardConfig): void {
    const routePrefix = config.routeType ? `[${config.routeType.toUpperCase()}]` : '';
    
    if (validation.allValid) {
      console.log(`✅ EnvironmentGuard ${routePrefix}: All environment variables validated successfully`);
    } else {
      const logLevel = config.routeType === 'admin' ? 'error' : 'warn';
      console[logLevel](`⚠️ EnvironmentGuard ${routePrefix}: Environment validation issues detected`);
      
      if (validation.errors.length > 0) {
        console[logLevel]('❌ Errors:', validation.errors);
      }
      
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Warnings:', validation.warnings);
      }
      
      if (validation.placeholderKeys.length > 0) {
        console.warn('🔧 Placeholder keys found:', validation.placeholderKeys);
      }
    }
  }

  getValidation(): ValidationSummary | null {
    return this.validation;
  }

  isValid(): boolean {
    return this.validation?.allValid ?? false;
  }

  getErrors(): string[] {
    return this.validation?.errors ?? [];
  }

  getWarnings(): string[] {
    return this.validation?.warnings ?? [];
  }

  hasPlaceholders(): boolean {
    return (this.validation?.placeholderKeys.length ?? 0) > 0;
  }

  // Utility method to check specific service availability
  isServiceConfigured(service: 'supabase' | 'stripe' | 'googleMaps' | 'resend'): boolean {
    if (!this.validation) return false;

    const serviceErrors = this.validation.errors.filter(error => 
      error.toLowerCase().includes(service.toLowerCase())
    );

    return serviceErrors.length === 0;
  }

  // Method to validate a single service at runtime
  validateService(service: 'supabase' | 'stripe' | 'googleMaps' | 'resend'): boolean {
    switch (service) {
      case 'supabase':
        return APIKeyValidator.validateSupabaseUrl(config.supabase.url).isValid &&
               APIKeyValidator.validateSupabaseAnonKey(config.supabase.anonKey).isValid;
      
      case 'stripe':
        return APIKeyValidator.validateStripePublishableKey(config.stripe.publishableKey).isValid;
      
      case 'googleMaps':
        return APIKeyValidator.validateGoogleMapsKey(config.googleMaps.apiKey).isValid;
      
      case 'resend':
        return APIKeyValidator.validateResendKey(config.resend.apiKey).isValid;
      
      default:
        return false;
    }
  }

  // Development helper to show current configuration status
  debugConfiguration(): void {
    if (config.app.environment !== 'development') {
      console.warn('🚫 Debug configuration only available in development mode');
      return;
    }

    console.group('🔧 Environment Configuration Debug');
    console.log('Environment:', config.app.environment);
    console.log('Supabase URL:', config.supabase.url ? '✅ Configured' : '❌ Missing');
    console.log('Supabase Key:', config.supabase.anonKey ? '✅ Configured' : '❌ Missing');
    console.log('Stripe Key:', config.stripe.publishableKey ? '✅ Configured' : '❌ Missing');
    console.log('Google Maps Key:', config.googleMaps.apiKey ? '✅ Configured' : '❌ Missing');
    console.log('Resend Key:', config.resend.apiKey ? '✅ Configured' : '❌ Missing');
    
    if (this.validation) {
      console.log('Validation Status:', this.validation.allValid ? '✅ Valid' : '❌ Invalid');
      if (!this.validation.allValid) {
        console.log('Errors:', this.validation.errors);
        console.log('Warnings:', this.validation.warnings);
      }
    }
    console.groupEnd();
  }
}

// Export singleton instance
export const environmentGuard = EnvironmentGuard.getInstance();