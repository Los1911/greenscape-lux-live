import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ClientOnboardingScreen } from './ClientOnboardingScreen';

interface OnboardingGuardProps {
  children: React.ReactNode;
  /** Called when onboarding is complete and user should proceed to dashboard */
  onComplete?: () => void;
}

interface OnboardingState {
  status: 'loading' | 'onboarding' | 'complete' | 'error';
  personalInfoComplete: boolean;
  serviceAddressComplete: boolean;
  profileData: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    email: string | null;
  } | null;
  errorMessage: string | null;
}

const log = (msg: string, data?: any) => {
  console.log(`[ONBOARDING_GUARD] ${msg}`, data !== undefined ? data : '');
};

/**
 * OnboardingGuard - THE SOLE AUTHORITY for onboarding completion
 * 
 * This component is the ONLY decision maker for whether to show onboarding or dashboard.
 * It fetches directly from the database and blocks rendering until the check completes.
 * 
 * SINGLE SOURCE OF TRUTH:
 * - Completion status is determined ONLY by database fields
 * - No localStorage, session flags, events, or derived UI logic
 * - Database is re-fetched after each save to confirm completion
 * 
 * PROFILE ROW GUARANTEE:
 * - If no profiles row exists for the user, one is created automatically
 * - This ensures update operations never fail silently
 * 
 * COMPLETION CONDITIONS (all must be true):
 * - first_name exists and is non-empty
 * - last_name exists and is non-empty
 * - phone exists and is non-empty
 * - address (street) exists and is non-empty
 * - city exists and is non-empty
 * - state exists and is non-empty
 * - zip exists and is non-empty
 */
export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ 
  children, 
  onComplete 
}) => {
  const { user, session, loading: authLoading, role } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    status: 'loading',
    personalInfoComplete: false,
    serviceAddressComplete: false,
    profileData: null,
    errorMessage: null,
  });
  
  const mountedRef = useRef(true);
  const checkInProgressRef = useRef(false);
  const hasCalledCompleteRef = useRef(false);

  /**
   * GUARANTEE: Ensure a profiles row exists for this user
   * If not, create a minimal one so subsequent updates work
   */
  const ensureProfileExists = useCallback(async (userId: string, userEmail: string | undefined): Promise<boolean> => {
    log('Ensuring profile row exists for user:', userId);
    
    // First, check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      log('Error checking for existing profile:', checkError.message);
      return false;
    }

    if (existingProfile) {
      log('Profile row already exists');
      return true;
    }

    // Profile doesn't exist - create minimal row
    log('No profile row found - creating one');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: userEmail || null,
        role: 'client',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      // Check if it's a duplicate key error (race condition - row was created by another process)
      if (insertError.code === '23505') {
        log('Profile was created by another process (race condition) - continuing');
        return true;
      }
      log('Error creating profile row:', insertError.message);
      return false;
    }

    log('Profile row created successfully');
    return true;
  }, []);

  /**
   * CORE FUNCTION: Fetch profile from database and evaluate completion
   * This is the ONLY place where onboarding completion is determined
   */
  const checkOnboardingFromDatabase = useCallback(async (): Promise<void> => {
    // Prevent concurrent checks
    if (checkInProgressRef.current) {
      log('Check already in progress, skipping');
      return;
    }

    // Wait for auth to be ready
    if (authLoading) {
      log('Waiting for auth...');
      return;
    }

    // No user = not in onboarding (they need to log in first)
    if (!user || !session) {
      log('No user/session - not in onboarding state');
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          status: 'complete', // Let them through - auth will handle redirect
          personalInfoComplete: false,
          serviceAddressComplete: false,
        }));
      }
      return;
    }

    // Only apply onboarding to clients
    if (role && role !== 'client') {
      log(`User is ${role}, not client - skipping onboarding`);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          status: 'complete',
          personalInfoComplete: true,
          serviceAddressComplete: true,
        }));
      }
      return;
    }

    checkInProgressRef.current = true;
    log('Starting onboarding check for user:', user.id);

    try {
      // STEP 1: GUARANTEE profile row exists
      const profileExists = await ensureProfileExists(user.id, user.email);
      if (!profileExists) {
        log('Failed to ensure profile exists');
        if (mountedRef.current) {
          setState({
            status: 'error',
            personalInfoComplete: false,
            serviceAddressComplete: false,
            profileData: null,
            errorMessage: 'Unable to initialize profile. Please try again.',
          });
        }
        checkInProgressRef.current = false;
        return;
      }

      // STEP 2: FETCH profile from database - This is the AUTHORITATIVE source
      log('Fetching profile from database');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, address, city, state, zip')
        .eq('id', user.id)
        .single(); // Use .single() now since we guaranteed the row exists

      if (profileError) {
        log('Profile fetch error:', profileError.message);
        if (mountedRef.current) {
          setState({
            status: 'error',
            personalInfoComplete: false,
            serviceAddressComplete: false,
            profileData: null,
            errorMessage: 'Unable to load profile. Please try again.',
          });
        }
        checkInProgressRef.current = false;
        return;
      }

      // STEP 3: EVALUATE COMPLETION based on database values
      // Personal Info: first_name AND last_name AND phone must be present
      const hasFirstName = !!(profile?.first_name && profile.first_name.trim());
      const hasLastName = !!(profile?.last_name && profile.last_name.trim());
      const hasPhone = !!(profile?.phone && profile.phone.trim());
      const personalComplete = hasFirstName && hasLastName && hasPhone;

      // Service Address: ALL address fields must be present
      const hasStreet = !!(profile?.address && profile.address.trim());
      const hasCity = !!(profile?.city && profile.city.trim());
      const hasState = !!(profile?.state && profile.state.trim());
      const hasZip = !!(profile?.zip && profile.zip.trim());
      const addressComplete = hasStreet && hasCity && hasState && hasZip;

      const isComplete = personalComplete && addressComplete;

      log('Database evaluation result:', {
        profileId: profile?.id,
        hasFirstName,
        hasLastName,
        hasPhone,
        hasStreet,
        hasCity,
        hasState,
        hasZip,
        personalComplete,
        addressComplete,
        isComplete,
      });

      const profileData = {
        firstName: profile?.first_name || null,
        lastName: profile?.last_name || null,
        phone: profile?.phone || null,
        address: profile?.address || null,
        city: profile?.city || null,
        state: profile?.state || null,
        zip: profile?.zip || null,
        email: profile?.email || user.email || null,
      };

      if (mountedRef.current) {
        setState({
          status: isComplete ? 'complete' : 'onboarding',
          personalInfoComplete: personalComplete,
          serviceAddressComplete: addressComplete,
          profileData,
          errorMessage: null,
        });

        // If complete and we haven't called onComplete yet, call it
        if (isComplete && !hasCalledCompleteRef.current) {
          log('Onboarding complete - calling onComplete callback');
          hasCalledCompleteRef.current = true;
          // Small delay to ensure state has propagated
          setTimeout(() => {
            onComplete?.();
          }, 100);
        }
      }
    } catch (error) {
      log('Unexpected error:', error);
      if (mountedRef.current) {
        setState({
          status: 'error',
          personalInfoComplete: false,
          serviceAddressComplete: false,
          profileData: null,
          errorMessage: 'Something went wrong. Please refresh the page.',
        });
      }
    } finally {
      checkInProgressRef.current = false;
    }
  }, [user, session, authLoading, role, onComplete, ensureProfileExists]);

  // Initial check on mount and when auth changes
  useEffect(() => {
    mountedRef.current = true;
    hasCalledCompleteRef.current = false;
    checkOnboardingFromDatabase();

    return () => {
      mountedRef.current = false;
    };
  }, [checkOnboardingFromDatabase]);

  /**
   * Handle step saved - re-check database and update state
   * This is called by ClientOnboardingScreen after a save completes
   */
  const handleStepSaved = useCallback(async () => {
    log('Step saved - re-checking database');
    // Reset the complete flag so we can call onComplete again if needed
    hasCalledCompleteRef.current = false;
    await checkOnboardingFromDatabase();
  }, [checkOnboardingFromDatabase]);

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    log('Retry requested');
    setState(prev => ({ ...prev, status: 'loading', errorMessage: null }));
    hasCalledCompleteRef.current = false;
    checkOnboardingFromDatabase();
  }, [checkOnboardingFromDatabase]);

  // LOADING STATE - Block render until database check completes
  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-emerald-400/70 text-sm mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (state.status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#020b06] to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-black/60 backdrop-blur border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{state.errorMessage || 'Unable to load your profile. Please try again.'}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ONBOARDING STATE - Show onboarding screen
  if (state.status === 'onboarding') {
    log('Showing onboarding screen', {
      personalInfoComplete: state.personalInfoComplete,
      serviceAddressComplete: state.serviceAddressComplete,
    });
    
    return (
      <ClientOnboardingScreen
        personalInfoComplete={state.personalInfoComplete}
        serviceAddressComplete={state.serviceAddressComplete}
        profileData={state.profileData}
        onStepSaved={handleStepSaved}
      />
    );
  }

  // COMPLETE STATE - Render children (dashboard)
  log('Onboarding complete - rendering dashboard');
  return <>{children}</>;
};

export default OnboardingGuard;
