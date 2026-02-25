/**
 * Stripe Connect Status Service
 * 
 * Handles syncing and monitoring Stripe Connect account status.
 * Works with webhook updates to keep the frontend in sync with Stripe's verification status.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface StripeConnectStatus {
  stripe_connect_id: string | null;
  stripe_account_status: string;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_onboarding_complete: boolean;
}

export const STRIPE_STATUS_REFRESH_EVENT = 'stripe-connect-status-refresh';

/**
 * Fetch current Stripe Connect status for a landscaper
 */
export async function fetchStripeConnectStatus(
  supabase: SupabaseClient,
  landscaperId: string
): Promise<StripeConnectStatus | null> {
  const { data, error } = await supabase
    .from('landscapers')
    .select(`
      stripe_connect_id,
      stripe_account_status,
      stripe_charges_enabled,
      stripe_payouts_enabled,
      stripe_details_submitted,
      stripe_onboarding_complete
    `)
    .eq('id', landscaperId)
    .single();

  if (error) {
    console.error('[StripeConnectStatus] Error fetching status:', error.message);
    return null;
  }

  return data as StripeConnectStatus;
}

/**
 * Subscribe to realtime Stripe Connect status updates
 * Called when webhook updates the landscaper record
 */
export function subscribeToStripeStatusUpdates(
  supabase: SupabaseClient,
  landscaperId: string,
  onUpdate: (status: StripeConnectStatus) => void
) {
  const channel = supabase
    .channel(`stripe-status-${landscaperId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'landscapers',
        filter: `id=eq.${landscaperId}`,
      },
      (payload) => {
        const newData = payload.new as any;
        // Only trigger if Stripe-related fields changed
        if (
          newData.stripe_account_status !== undefined ||
          newData.stripe_charges_enabled !== undefined ||
          newData.stripe_payouts_enabled !== undefined
        ) {
          console.log('[StripeConnectStatus] Realtime update received:', newData);
          onUpdate({
            stripe_connect_id: newData.stripe_connect_id,
            stripe_account_status: newData.stripe_account_status || 'pending',
            stripe_charges_enabled: newData.stripe_charges_enabled || false,
            stripe_payouts_enabled: newData.stripe_payouts_enabled || false,
            stripe_details_submitted: newData.stripe_details_submitted || false,
            stripe_onboarding_complete: newData.stripe_onboarding_complete || false,
          });
          
          // Dispatch global event for other components
          window.dispatchEvent(new CustomEvent(STRIPE_STATUS_REFRESH_EVENT));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Determine if account is fully active
 */
export function isAccountActive(status: StripeConnectStatus): boolean {
  return (
    status.stripe_charges_enabled &&
    status.stripe_payouts_enabled &&
    status.stripe_account_status === 'active'
  );
}

/**
 * Get human-readable status message
 */
export function getStatusMessage(status: StripeConnectStatus): string {
  if (isAccountActive(status)) {
    return 'Your account is verified and ready to receive payments.';
  }
  
  switch (status.stripe_account_status) {
    case 'pending':
      return 'Please complete your Stripe account setup.';
    case 'pending_verification':
      return 'Your account is being verified by Stripe.';
    case 'restricted':
      return 'Your account has restrictions. Please check Stripe for details.';
    default:
      return 'Set up your payment account to receive earnings.';
  }
}

/**
 * Trigger a manual refresh event for all listening components
 */
export function triggerStatusRefresh(): void {
  window.dispatchEvent(new CustomEvent(STRIPE_STATUS_REFRESH_EVENT));
}
