/**
 * Feature Flags Configuration
 * 
 * Controls visibility and access to features that are:
 * - In development
 * - Temporarily disabled
 * - Awaiting launch approval
 * 
 * SAFETY: Missing or undefined flags default to FALSE (disabled)
 * This ensures features are opt-in, not opt-out.
 */

export interface FeatureFlags {
  // Legacy Admin Panel - Contact Management & Email Templates
  // Status: DISABLED - Not part of operational admin system
  // Re-enable when CMS functionality is needed
  FEATURE_ADMIN_CONTACT_PANEL: boolean;
  
  // Future flags can be added here
  // FEATURE_ADVANCED_ANALYTICS: boolean;
  // FEATURE_AI_SCHEDULING: boolean;
}

/**
 * Default feature flag values
 * All flags default to FALSE for safety
 */
const DEFAULT_FLAGS: FeatureFlags = {
  FEATURE_ADMIN_CONTACT_PANEL: false,
};

/**
 * Runtime feature flag overrides
 * Can be set via environment variables or remote config
 */
const getRuntimeFlags = (): Partial<FeatureFlags> => {
  const flags: Partial<FeatureFlags> = {};
  
  // Check for environment variable overrides
  // Format: VITE_FEATURE_FLAG_NAME=true
  try {
    const adminContactPanel = import.meta.env.VITE_FEATURE_ADMIN_CONTACT_PANEL;
    if (adminContactPanel !== undefined) {
      flags.FEATURE_ADMIN_CONTACT_PANEL = adminContactPanel === 'true';
    }
  } catch {
    // Environment variable access failed - use defaults
  }
  
  return flags;
};

/**
 * Get current feature flags with runtime overrides
 */
export const getFeatureFlags = (): FeatureFlags => {
  const runtimeFlags = getRuntimeFlags();
  return {
    ...DEFAULT_FLAGS,
    ...runtimeFlags,
  };
};

/**
 * Check if a specific feature is enabled
 * Returns FALSE if flag is missing or undefined (safe default)
 */
export const isFeatureEnabled = (flagName: keyof FeatureFlags): boolean => {
  try {
    const flags = getFeatureFlags();
    return flags[flagName] === true;
  } catch {
    // Any error defaults to disabled
    console.warn(`[FeatureFlags] Error checking flag ${flagName}, defaulting to disabled`);
    return false;
  }
};

/**
 * Hook-friendly feature flag checker
 * Safe to call in components
 */
export const useFeatureFlag = (flagName: keyof FeatureFlags): boolean => {
  return isFeatureEnabled(flagName);
};

/**
 * Debug: Log all feature flags (admin only)
 */
export const logFeatureFlags = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[FeatureFlags] Current configuration:', getFeatureFlags());
  }
};
