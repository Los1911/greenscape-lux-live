import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * IMPORTANT: This hook is for UI display purposes ONLY.
 * 
 * The OnboardingGuard is the SOLE AUTHORITY for onboarding completion decisions.
 * This hook should NOT be used to determine whether to show onboarding or dashboard.
 * 
 * Use this hook for:
 * - Displaying profile data in UI components
 * - Showing progress indicators
 * - Pre-filling form fields
 * 
 * Do NOT use this hook for:
 * - Deciding whether onboarding is complete
 * - Triggering navigation
 * - Blocking access to features
 */

export interface OnboardingStatus {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  
  // Individual step completion (for UI display only)
  personalInfoComplete: boolean;
  serviceAddressComplete: boolean;
  
  // Progress tracking (for UI display only)
  currentStep: number;
  totalSteps: number;
  
  // Profile data (for display)
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
  
  // Actions
  refresh: () => Promise<void>;
}

const log = (msg: string, data?: any) => {
  console.log(`[ONBOARDING_STATUS_HOOK] ${msg}`, data !== undefined ? data : '');
};

export const useOnboardingStatus = (): OnboardingStatus => {
  const { user, session, loading: authLoading, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [personalInfoComplete, setPersonalInfoComplete] = useState(false);
  const [serviceAddressComplete, setServiceAddressComplete] = useState(false);
  const [profileData, setProfileData] = useState<OnboardingStatus['profileData']>(null);
  
  const mountedRef = useRef(true);

  /**
   * Fetch profile data from database for UI display
   */
  const fetchProfileData = useCallback(async () => {
    if (!user || !session) {
      log('No user/session');
      setIsLoading(false);
      return;
    }

    // Only apply to clients
    if (role && role !== 'client') {
      log(`User is ${role}, not client`);
      setIsLoading(false);
      setPersonalInfoComplete(true);
      setServiceAddressComplete(true);
      return;
    }

    try {
      log('Fetching profile data for UI display');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, address, city, state, zip')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        log('Profile fetch error:', profileError.message);
        if (mountedRef.current) {
          setHasError(true);
          setErrorMessage('Unable to load profile.');
          setIsLoading(false);
        }
        return;
      }

      // Evaluate completion for UI display
      const hasFirstName = !!(profile?.first_name && profile.first_name.trim());
      const hasLastName = !!(profile?.last_name && profile.last_name.trim());
      const hasPhone = !!(profile?.phone && profile.phone.trim());
      const personalComplete = hasFirstName && hasLastName && hasPhone;

      const hasStreet = !!(profile?.address && profile.address.trim());
      const hasCity = !!(profile?.city && profile.city.trim());
      const hasState = !!(profile?.state && profile.state.trim());
      const hasZip = !!(profile?.zip && profile.zip.trim());
      const addressComplete = hasStreet && hasCity && hasState && hasZip;

      const data: OnboardingStatus['profileData'] = {
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
        setPersonalInfoComplete(personalComplete);
        setServiceAddressComplete(addressComplete);
        setProfileData(data);
        setHasError(false);
        setErrorMessage(null);
        setIsLoading(false);
      }
    } catch (error) {
      log('Unexpected error:', error);
      if (mountedRef.current) {
        setHasError(true);
        setErrorMessage('Something went wrong.');
        setIsLoading(false);
      }
    }
  }, [user, session, role]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (!authLoading) {
      fetchProfileData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [authLoading, fetchProfileData]);

  // Calculate current step for UI display
  const currentStep = personalInfoComplete ? (serviceAddressComplete ? 2 : 2) : 1;
  const totalSteps = 2;

  const refresh = useCallback(async () => {
    log('Manual refresh triggered');
    setIsLoading(true);
    await fetchProfileData();
  }, [fetchProfileData]);

  return {
    isLoading: isLoading || authLoading,
    hasError,
    errorMessage,
    personalInfoComplete,
    serviceAddressComplete,
    currentStep,
    totalSteps,
    profileData,
    refresh,
  };
};

export default useOnboardingStatus;
