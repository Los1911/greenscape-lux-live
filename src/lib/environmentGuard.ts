// ---------------------------------------------------------------------------
// Environment Guard (SAFE VERSION – DOES NOT BREAK PRODUCTION)
// ---------------------------------------------------------------------------

import { validateEnvironment } from './envValidator';
import { config } from './config';

export interface EnvironmentGuardConfig {
  strictMode: boolean;
  allowPlaceholders: boolean;
  requiredServices: string[];
  routeType?: 'admin' | 'client' | 'landscaper' | 'public';
}

export class EnvironmentGuard {
  private static instance: EnvironmentGuard;
  private validation: ReturnType<typeof validateEnvironment> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EnvironmentGuard {
    if (!EnvironmentGuard.instance) {
      EnvironmentGuard.instance = new EnvironmentGuard();
    }
    return EnvironmentGuard.instance;
  }

  // ---------------------------------------------------------------------------
  // Route-aware initialization
  // ---------------------------------------------------------------------------
  async initializeForRoute(
    currentPath?: string,
    guardConfig?: Partial<EnvironmentGuardConfig>
  ) {
    const routeType = this.determineRouteType(currentPath);

    const defaultConfig: EnvironmentGuardConfig = {
      strictMode: false, // 🚫 Strict mode disabled globally for safety
      allowPlaceholders: true,
      requiredServices: this.getRequiredServicesForRoute(routeType),
      routeType
    };

    const finalConfig = { ...defaultConfig, ...guardConfig };

    console.log(`🔒 EnvironmentGuard: Initializing for ${routeType} route`, finalConfig);

    // -------------------------------------------------------
    // RUN THE NEW SAFE VALIDATOR
    // -------------------------------------------------------
    this.validation = validateEnvironment();

    // DEV-only logs
    if (import.meta.env.DEV) {
      console.group(`🌿 Environment Validation (${routeType})`);
      console.log("isValid:", this.validation.isValid);
      console.log("errors:", this.validation.errors);
      console.log("warnings:", this.validation.warnings);
      console.groupEnd();
    }

    // -------------------------------------------------------
    // PRODUCTION MUST NEVER CRASH
    // -------------------------------------------------------
    if (import.meta.env.PROD) {
      if (!this.validation.isValid) {
        console.warn(
          `⚠️ Production environment warnings (${routeType} route):`,
          this.validation.errors
        );
      }
      this.isInitialized = true;
      return this.validation;
    }

    // -------------------------------------------------------
    // DEV MODE: Show errors but DO NOT THROW
    // -------------------------------------------------------
    if (!this.validation.isValid) {
      console.warn(`⚠️ DEV Environment issues (${routeType}):`, this.validation.errors);
    } else {
      console.log(`✅ Environment validated successfully (${routeType})`);
    }

    this.isInitialized = true;
    return this.validation;
  }

  // Maintain backwards compatibility
  async initialize(guardConfig?: Partial<EnvironmentGuardConfig>) {
    return this.initializeForRoute(undefined, guardConfig);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private determineRouteType(path?: string): 'admin' | 'client' | 'landscaper' | 'public' {
    if (!path && typeof window !== 'undefined') {
      path = window.location.pathname;
    }
    if (!path) return 'public';

    if (path.includes('/admin')) return 'admin';
    if (path.includes('/client') || path.includes('/dashboard')) return 'client';
    if (path.includes('/landscaper') || path.includes('/pro')) return 'landscaper';

    return 'public';
  }

  private getRequiredServicesForRoute(route: string): string[] {
    switch (route) {
      case 'admin':
        return ['Supabase URL', 'Supabase Anon Key'];
      case 'client':
      case 'landscaper':
        return ['Supabase URL', 'Supabase Anon Key'];
      default:
        return ['Supabase URL'];
    }
  }

  // ---------------------------------------------------------------------------
  // Diagnostics (Always Safe)
  // ---------------------------------------------------------------------------
  debugConfiguration() {
    console.group('🔧 Environment Configuration Debug');

    console.log("Environment:", config.app.environment);
    console.log("Supabase URL:", config.supabase.url ? "✅" : "❌");
    console.log("Supabase Key:", config.supabase.anonKey ? "✅" : "❌");
    console.log("Stripe Key:", config.stripe.publishableKey ? "✅" : "❌");
    console.log("Google Maps Key:", config.googleMaps.apiKey ? "✅" : "❌");
    console.log("Resend Key:", config.resend.apiKey ? "✅" : "❌");

    if (this.validation) {
      console.log("Validation:", this.validation.isValid ? "✅ Valid" : "⚠️ Warnings");
      if (!this.validation.isValid) {
        console.log("Errors:", this.validation.errors);
        console.log("Warnings:", this.validation.warnings);
      }
    }

    console.groupEnd();
  }

  // Safe getters
  getValidation() {
    return this.validation;
  }
  isValid() {
    return this.validation?.isValid ?? false;
  }
  getErrors() {
    return this.validation?.errors ?? [];
  }
  getWarnings() {
    return this.validation?.warnings ?? [];
  }
}

// Export singleton
export const environmentGuard = EnvironmentGuard.getInstance();