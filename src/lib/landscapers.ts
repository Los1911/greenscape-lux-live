import { supabase } from "./supabase";
import { isUUID } from "./isUUID";
import { LANDSCAPERS_COLUMNS, normalizeLandscaper } from "./databaseSchema";

// READ-ONLY helpers only - no profile creation
// Profile creation handled by RPC ensure_user_and_landscaper

export interface LandscaperProfile {
  id: string;
  user_id: string;
  business_name: string;
  approved: boolean;
  is_approved: boolean;
  insurance_verified: boolean;
  tier: string;
  completed_jobs_count: number;
  average_rating: number;
  rating: number;
  reliability_score: number;
  stripe_connect_id: string;
  stripe_account_status: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export async function getMyLandscaper(): Promise<{ data: LandscaperProfile | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Use explicit column selection instead of select('*')
    const { data, error } = await supabase
      .from('landscapers')
      .select(LANDSCAPERS_COLUMNS.profileView)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[getMyLandscaper] Query error:', error.message);
      return { data: null, error };
    }

    // Normalize the data to handle missing columns safely
    const normalized = normalizeLandscaper(data as Record<string, unknown>);
    return { data: normalized as LandscaperProfile | null, error: null };
  } catch (err) {
    console.error('[getMyLandscaper] Unexpected error:', err);
    return { data: null, error: err as Error };
  }
}

export async function getLandscaperById(id: string): Promise<{ data: LandscaperProfile | null; error: Error | null }> {
  if (!isUUID(id)) {
    return { data: null, error: new Error('Invalid landscaper id') };
  }
  
  try {
    // Use explicit column selection instead of select('*')
    const { data, error } = await supabase
      .from('landscapers')
      .select(LANDSCAPERS_COLUMNS.profileView)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('[getLandscaperById] Query error:', error.message);
      return { data: null, error };
    }

    // Normalize the data to handle missing columns safely
    const normalized = normalizeLandscaper(data as Record<string, unknown>);
    return { data: normalized as LandscaperProfile | null, error: null };
  } catch (err) {
    console.error('[getLandscaperById] Unexpected error:', err);
    return { data: null, error: err as Error };
  }
}

/**
 * Get landscaper with Stripe Connect information
 */
export async function getLandscaperStripeStatus(userId: string): Promise<{ data: LandscaperProfile | null; error: Error | null }> {
  if (!userId) {
    return { data: null, error: new Error('User ID required') };
  }
  
  try {
    // Use explicit Stripe-related column selection
    const { data, error } = await supabase
      .from('landscapers')
      .select(LANDSCAPERS_COLUMNS.stripeView)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[getLandscaperStripeStatus] Query error:', error.message);
      return { data: null, error };
    }

    // Normalize the data to handle missing columns safely
    const normalized = normalizeLandscaper(data as Record<string, unknown>);
    return { data: normalized as LandscaperProfile | null, error: null };
  } catch (err) {
    console.error('[getLandscaperStripeStatus] Unexpected error:', err);
    return { data: null, error: err as Error };
  }
}

// removed legacy RPC call — handled by trigger in DB
