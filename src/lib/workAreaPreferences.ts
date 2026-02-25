/**
 * Work Area Preferences - Utility functions for managing landscaper work areas
 * 
 * This module handles:
 * - Requested work areas (ZIP codes where landscaper wants to receive jobs)
 * - Excluded areas (ZIP codes where landscaper does NOT want to work)
 * - Job visibility logic based on work area preferences
 * - Automatic area addition when accepting jobs
 */

import { supabase } from '@/lib/supabase';

export interface WorkArea {
  id: string;
  landscaper_id: string;
  zip_code: string;
  radius_miles: number;
  is_temporary: boolean;
  expires_at: string | null;
  auto_added: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExcludedArea {
  id: string;
  landscaper_id: string;
  zip_code: string;
  reason: string | null;
  created_at: string;
}

export interface WorkAreaPreferences {
  requestedAreas: WorkArea[];
  excludedAreas: ExcludedArea[];
}

/**
 * Extract ZIP code from an address string
 */
export function extractZipFromAddress(address: string): string | null {
  if (!address) return null;
  
  // Match 5-digit ZIP or ZIP+4 format
  const zipMatch = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return zipMatch ? zipMatch[1] : null;
}

/**
 * Check if a ZIP code is within radius of another ZIP code
 * This is a simplified check - in production you'd use a geocoding service
 * For now, we use a basic prefix matching for nearby ZIPs
 */
export function isZipWithinRadius(targetZip: string, baseZip: string, radiusMiles: number): boolean {
  if (!targetZip || !baseZip) return false;
  
  // Exact match
  if (targetZip === baseZip) return true;
  
  // For simplicity, consider ZIPs with same first 3 digits as "nearby"
  // In production, you'd use actual geocoding/distance calculation
  if (radiusMiles >= 10 && targetZip.substring(0, 3) === baseZip.substring(0, 3)) {
    return true;
  }
  
  // For larger radius, consider same first 2 digits
  if (radiusMiles >= 25 && targetZip.substring(0, 2) === baseZip.substring(0, 2)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a job is visible to a landscaper based on work area preferences
 */
export function isJobVisibleToLandscaper(
  jobAddress: string | null | undefined,
  preferences: WorkAreaPreferences
): { visible: boolean; reason?: string } {
  const jobZip = jobAddress ? extractZipFromAddress(jobAddress) : null;
  
  // If no ZIP can be extracted, show the job (don't block on missing data)
  if (!jobZip) {
    return { visible: true, reason: 'No ZIP code in job address' };
  }
  
  // Check if job is in an excluded area
  const isExcluded = preferences.excludedAreas.some(
    area => area.zip_code === jobZip
  );
  
  if (isExcluded) {
    return { visible: false, reason: 'Job is in an excluded area' };
  }
  
  // If no requested areas are set, show all jobs (default behavior)
  if (preferences.requestedAreas.length === 0) {
    return { visible: true, reason: 'No work area preferences set' };
  }
  
  // Check if job is within any requested work area
  const isInRequestedArea = preferences.requestedAreas.some(area => {
    // Skip expired temporary areas
    if (area.is_temporary && area.expires_at) {
      const expiresAt = new Date(area.expires_at);
      if (expiresAt < new Date()) {
        return false;
      }
    }
    
    return isZipWithinRadius(jobZip, area.zip_code, area.radius_miles);
  });
  
  if (isInRequestedArea) {
    return { visible: true, reason: 'Job is in a requested work area' };
  }
  
  return { visible: false, reason: 'Job is outside requested work areas' };
}

/**
 * Load work area preferences for a landscaper
 */
export async function loadWorkAreaPreferences(landscaperId: string): Promise<WorkAreaPreferences> {
  try {
    const [workAreasResult, excludedAreasResult] = await Promise.all([
      supabase
        .from('landscaper_work_areas')
        .select('*')
        .eq('landscaper_id', landscaperId)
        .order('created_at', { ascending: false }),
      supabase
        .from('landscaper_excluded_areas')
        .select('*')
        .eq('landscaper_id', landscaperId)
        .order('created_at', { ascending: false })
    ]);

    return {
      requestedAreas: workAreasResult.data || [],
      excludedAreas: excludedAreasResult.data || []
    };
  } catch (error) {
    console.error('[WorkAreaPreferences] Error loading preferences:', error);
    return { requestedAreas: [], excludedAreas: [] };
  }
}

/**
 * Add a requested work area
 */
export async function addRequestedWorkArea(
  landscaperId: string,
  zipCode: string,
  radiusMiles: number = 10,
  isTemporary: boolean = false,
  expiresAt: string | null = null,
  autoAdded: boolean = false
): Promise<{ success: boolean; error?: string; data?: WorkArea }> {
  try {
    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      return { success: false, error: 'Invalid ZIP code format. Please enter a 5-digit ZIP code.' };
    }

    const { data, error } = await supabase
      .from('landscaper_work_areas')
      .upsert({
        landscaper_id: landscaperId,
        zip_code: zipCode,
        radius_miles: radiusMiles,
        is_temporary: isTemporary,
        expires_at: expiresAt,
        auto_added: autoAdded,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'landscaper_id,zip_code'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('[WorkAreaPreferences] Error adding work area:', error);
    return { success: false, error: error.message || 'Failed to add work area' };
  }
}

/**
 * Remove a requested work area
 */
export async function removeRequestedWorkArea(
  landscaperId: string,
  workAreaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('landscaper_work_areas')
      .delete()
      .eq('id', workAreaId)
      .eq('landscaper_id', landscaperId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[WorkAreaPreferences] Error removing work area:', error);
    return { success: false, error: error.message || 'Failed to remove work area' };
  }
}

/**
 * Add an excluded area
 */
export async function addExcludedArea(
  landscaperId: string,
  zipCode: string,
  reason: string = ''
): Promise<{ success: boolean; error?: string; data?: ExcludedArea }> {
  try {
    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      return { success: false, error: 'Invalid ZIP code format. Please enter a 5-digit ZIP code.' };
    }

    const { data, error } = await supabase
      .from('landscaper_excluded_areas')
      .upsert({
        landscaper_id: landscaperId,
        zip_code: zipCode,
        reason: reason || null
      }, {
        onConflict: 'landscaper_id,zip_code'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('[WorkAreaPreferences] Error adding excluded area:', error);
    return { success: false, error: error.message || 'Failed to add excluded area' };
  }
}

/**
 * Remove an excluded area
 */
export async function removeExcludedArea(
  landscaperId: string,
  excludedAreaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('landscaper_excluded_areas')
      .delete()
      .eq('id', excludedAreaId)
      .eq('landscaper_id', landscaperId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[WorkAreaPreferences] Error removing excluded area:', error);
    return { success: false, error: error.message || 'Failed to remove excluded area' };
  }
}

/**
 * Auto-add a work area when a landscaper accepts a job
 * This enables batching nearby jobs without additional setup
 */
export async function autoAddWorkAreaFromJob(
  landscaperId: string,
  jobAddress: string
): Promise<{ success: boolean; error?: string }> {
  const zipCode = extractZipFromAddress(jobAddress);
  
  if (!zipCode) {
    return { success: false, error: 'Could not extract ZIP code from job address' };
  }

  // Add as a temporary work area that expires at end of day
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return addRequestedWorkArea(
    landscaperId,
    zipCode,
    5, // 5 mile radius for auto-added areas
    true, // temporary
    endOfDay.toISOString(),
    true // auto_added flag
  );
}

/**
 * Clean up expired temporary work areas
 */
export async function cleanupExpiredWorkAreas(landscaperId: string): Promise<void> {
  try {
    await supabase
      .from('landscaper_work_areas')
      .delete()
      .eq('landscaper_id', landscaperId)
      .eq('is_temporary', true)
      .lt('expires_at', new Date().toISOString());
  } catch (error) {
    console.error('[WorkAreaPreferences] Error cleaning up expired areas:', error);
  }
}

/**
 * Filter jobs based on work area preferences
 */
export function filterJobsByWorkArea(
  jobs: any[],
  preferences: WorkAreaPreferences
): { visibleJobs: any[]; hiddenJobs: any[] } {
  const visibleJobs: any[] = [];
  const hiddenJobs: any[] = [];

  for (const job of jobs) {
    const { visible } = isJobVisibleToLandscaper(
      job.service_address || job.address,
      preferences
    );

    if (visible) {
      visibleJobs.push(job);
    } else {
      hiddenJobs.push(job);
    }
  }

  return { visibleJobs, hiddenJobs };
}
