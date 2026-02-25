/**
 * Service Area Utilities
 * 
 * Clean abstraction for service coverage checking.
 * All coverage decisions are delegated to the Edge Function.
 * Frontend has ZERO knowledge of city-to-ZIP mappings.
 * 
 * Architecture:
 * - Frontend passes ZIP (and optional city/state) to checkServiceCoverage()
 * - Edge function handles ZIP → city/state resolution
 * - Edge function applies priority logic (ZIP > city > region)
 * - Frontend renders the response
 * 
 * Coverage Priority: ZIP > city > region
 */

import { supabase } from '@/lib/supabase';
import { invokeEdgeFunction } from '@/lib/edgeFunctions';

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceCoverageResult {
  hasCoverage: boolean;
  isConfigured: boolean;
  landscaperCount: number;
  areaInfo?: {
    type: 'zip' | 'city' | 'region' | 'none';
    city?: string;
    state?: string;
    label?: string;
    priority?: number;
  };
  error?: string;
}

interface EdgeCoverageResponse {
  hasCoverage: boolean;
  isConfigured: boolean;
  areaType: 'zip' | 'city' | 'region' | 'none';
  areaLabel?: string;
  priority: number;
  city?: string;
  state?: string;
  error?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Set to true to use edge function, false to use direct database queries
// Edge function is preferred for production as it centralizes all coverage logic
const USE_EDGE_FUNCTION = true;

// ============================================================================
// MAIN COVERAGE CHECK FUNCTION
// ============================================================================

/**
 * Check if a location has service coverage.
 * This is the ONLY function that should be called for coverage checks.
 * 
 * @param zipCode - ZIP code to check (required)
 * @param city - Optional city name (improves accuracy if ZIP resolution fails)
 * @param state - Optional state code (improves accuracy if ZIP resolution fails)
 */
export async function checkServiceCoverage(
  zipCode: string,
  city?: string,
  state?: string
): Promise<ServiceCoverageResult> {
  const defaultResult: ServiceCoverageResult = {
    hasCoverage: false,
    isConfigured: false,
    landscaperCount: 0
  };

  if (!zipCode && !city) {
    return { ...defaultResult, error: 'ZIP code or city required' };
  }

  try {
    if (USE_EDGE_FUNCTION) {
      return await checkCoverageViaEdgeFunction(zipCode, city, state);
    } else {
      return await checkCoverageViaDatabase(zipCode, city, state);
    }
  } catch (err) {
    console.error('[SERVICE_AREA_UTILS] Coverage check exception:', err);
    return { ...defaultResult, error: 'Coverage check failed' };
  }
}

// ============================================================================
// EDGE FUNCTION IMPLEMENTATION
// ============================================================================

/**
 * Check coverage via edge function (preferred method)
 * Edge function is the single source of truth for coverage decisions
 */
async function checkCoverageViaEdgeFunction(
  zipCode: string,
  city?: string,
  state?: string
): Promise<ServiceCoverageResult> {
  const defaultResult: ServiceCoverageResult = {
    hasCoverage: false,
    isConfigured: false,
    landscaperCount: 0
  };

  try {
    const { data, error } = await invokeEdgeFunction<EdgeCoverageResponse>(
      'check-service-coverage',
      { body: { zipCode, city, state } }
    );

    if (error) {
      console.error('[SERVICE_AREA_UTILS] Edge function error:', error);
      // Fallback to database query if edge function fails
      console.log('[SERVICE_AREA_UTILS] Falling back to database query');
      return await checkCoverageViaDatabase(zipCode, city, state);
    }

    if (!data) {
      return { ...defaultResult, error: 'No response from coverage service' };
    }

    return {
      hasCoverage: data.hasCoverage,
      isConfigured: data.isConfigured,
      landscaperCount: 0,
      areaInfo: data.hasCoverage ? {
        type: data.areaType,
        city: data.city,
        state: data.state,
        label: data.areaLabel,
        priority: data.priority
      } : undefined,
      error: data.error
    };
  } catch (err) {
    console.error('[SERVICE_AREA_UTILS] Edge function exception:', err);
    // Fallback to database query
    return await checkCoverageViaDatabase(zipCode, city, state);
  }
}

// ============================================================================
// DATABASE FALLBACK IMPLEMENTATION
// ============================================================================

/**
 * Check coverage via direct database query (fallback method)
 * Used when edge function is unavailable or disabled
 * 
 * NOTE: This method cannot resolve ZIP to city/state without the edge function.
 * It can only check:
 * 1. Exact ZIP matches in admin_service_areas
 * 2. City/state matches if provided by caller
 */
async function checkCoverageViaDatabase(
  zipCode: string,
  city?: string,
  state?: string
): Promise<ServiceCoverageResult> {
  const defaultResult: ServiceCoverageResult = {
    hasCoverage: false,
    isConfigured: false,
    landscaperCount: 0
  };

  try {
    // Check if any service areas are configured
    const { count: totalCount, error: countError } = await supabase
      .from('admin_service_areas')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('[SERVICE_AREA_UTILS] Count error:', countError);
      return { ...defaultResult, error: 'Unable to check configuration' };
    }

    const isConfigured = (totalCount ?? 0) > 0;

    if (!isConfigured) {
      return { ...defaultResult, isConfigured: false };
    }

    // Priority 1: Check for exact ZIP code match
    if (zipCode) {
      const { data: zipData, error: zipError } = await supabase
        .from('admin_service_areas')
        .select('id, area_type, city, state, priority')
        .eq('is_active', true)
        .eq('area_type', 'zip')
        .eq('zip_code', zipCode)
        .order('priority', { ascending: false })
        .limit(1);

      if (zipError) {
        console.error('[SERVICE_AREA_UTILS] ZIP coverage check error:', zipError);
      }

      if (zipData && zipData.length > 0) {
        console.log('[SERVICE_AREA_UTILS] ZIP-level coverage found for:', zipCode);
        return {
          hasCoverage: true,
          isConfigured: true,
          landscaperCount: 0,
          areaInfo: {
            type: 'zip',
            city: zipData[0].city || undefined,
            state: zipData[0].state || undefined,
            label: `ZIP ${zipCode}`,
            priority: zipData[0].priority
          }
        };
      }
    }

    // Priority 2: Check for city-level match (only if city/state provided)
    if (city && state) {
      const { data: cityData, error: cityError } = await supabase
        .from('admin_service_areas')
        .select('id, area_type, city, state, priority')
        .eq('is_active', true)
        .eq('area_type', 'city')
        .ilike('city', city)
        .ilike('state', state)
        .order('priority', { ascending: false })
        .limit(1);

      if (cityError) {
        console.error('[SERVICE_AREA_UTILS] City coverage check error:', cityError);
      }

      if (cityData && cityData.length > 0) {
        console.log('[SERVICE_AREA_UTILS] City-level coverage found:', city, state);
        return {
          hasCoverage: true,
          isConfigured: true,
          landscaperCount: 0,
          areaInfo: {
            type: 'city',
            city: cityData[0].city || undefined,
            state: cityData[0].state || undefined,
            label: `${city}, ${state}`,
            priority: cityData[0].priority
          }
        };
      }
    }

    // No coverage found
    console.log('[SERVICE_AREA_UTILS] No coverage found for:', { zipCode, city, state });
    return {
      hasCoverage: false,
      isConfigured: true,
      landscaperCount: 0
    };

  } catch (err) {
    console.error('[SERVICE_AREA_UTILS] Database coverage check exception:', err);
    return { ...defaultResult, error: 'Coverage check failed' };
  }
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

/**
 * @deprecated Use checkServiceCoverage() instead
 * Check if a specific ZIP code has active coverage.
 */
export async function checkZipCoverage(zipCode: string): Promise<ServiceCoverageResult> {
  return checkServiceCoverage(zipCode);
}

/**
 * @deprecated Use checkServiceCoverage() instead
 * Check coverage with explicit city/state.
 */
export async function checkCoverageWithLocation(
  zipCode: string,
  city?: string,
  state?: string
): Promise<ServiceCoverageResult> {
  return checkServiceCoverage(zipCode, city, state);
}

/**
 * Check if a job location is in a covered service area.
 * Extracts location info from address and delegates to checkServiceCoverage.
 */
export async function isJobLocationCovered(
  serviceAddress: string,
  zipCode?: string,
  city?: string,
  state?: string
): Promise<boolean> {
  try {
    // If ZIP provided, use it directly
    if (zipCode) {
      const result = await checkServiceCoverage(zipCode, city, state);
      return result.hasCoverage;
    }

    // Try to extract ZIP from service address
    const zipMatch = serviceAddress?.match(/\b(\d{5})(?:-\d{4})?\b/);
    const extractedZip = zipMatch ? zipMatch[1] : '';

    // Try to extract city/state from address
    // Pattern: "City, ST" or "City, State"
    let extractedCity = city;
    let extractedState = state;
    
    if (!extractedCity || !extractedState) {
      const cityStateMatch = serviceAddress?.match(/([A-Za-z\s]+),\s*([A-Z]{2})\b/i);
      if (cityStateMatch) {
        extractedCity = extractedCity || cityStateMatch[1].trim();
        extractedState = extractedState || cityStateMatch[2].toUpperCase();
      }
    }

    if (extractedZip || (extractedCity && extractedState)) {
      const result = await checkServiceCoverage(extractedZip, extractedCity, extractedState);
      return result.hasCoverage;
    }

    // Cannot determine coverage without location info
    console.log('[SERVICE_AREA_UTILS] Could not extract location from address:', serviceAddress);
    return false;
  } catch (err) {
    console.error('[SERVICE_AREA_UTILS] Job location coverage check error:', err);
    return false;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if service areas are configured at all.
 * Returns false if table is empty or on any error.
 */
export async function isServiceAreaConfigured(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('admin_service_areas')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('[SERVICE_AREA_UTILS] Config check error:', error);
      return false;
    }
    
    return (count ?? 0) > 0;
  } catch (err) {
    console.error('[SERVICE_AREA_UTILS] Config check exception:', err);
    return false;
  }
}

/**
 * Get list of active service areas for display.
 * Returns empty array on any error.
 */
export async function getActiveServiceAreas(): Promise<Array<{
  id: string;
  area_type: string;
  zip_code: string | null;
  city: string | null;
  state: string | null;
}>> {
  try {
    const { data, error } = await supabase
      .from('admin_service_areas')
      .select('id, area_type, zip_code, city, state')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[SERVICE_AREA_UTILS] Get active areas error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[SERVICE_AREA_UTILS] Get active areas exception:', err);
    return [];
  }
}

/**
 * Feature gate: Check if service area management is available.
 * Use this to conditionally show/hide service area features.
 */
export async function isServiceAreaFeatureEnabled(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_service_areas')
      .select('id')
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
