import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  formattedAddress: string;
  stripeCustomerId: string | null;
  createdAt: string | null;
}

interface UseClientProfileReturn {
  profile: ClientProfileData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasProfileData: boolean;
  hasAddressData: boolean;
}

const DEFAULT_PROFILE: ClientProfileData = {
  id: '',
  email: '',
  firstName: '',
  lastName: '',
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  formattedAddress: '',
  stripeCustomerId: null,
  createdAt: null,
};

/**
 * Hook to fetch and manage client profile data
 * - Fetches profile from Supabase on mount
 * - Listens for profileUpdated and addressUpdated events
 * - Provides refresh function for manual updates
 * - Returns loading and error states
 */
export const useClientProfile = (): UseClientProfileReturn => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (authLoading) {
      console.log('[USE_CLIENT_PROFILE] Waiting for auth...');
      return;
    }

    if (!user) {
      console.log('[USE_CLIENT_PROFILE] No user, clearing profile');
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      console.log('[USE_CLIENT_PROFILE] Fetching profile for user:', user.id);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone, address, city, state, zip, stripe_customer_id, created_at')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('[USE_CLIENT_PROFILE] Fetch error:', fetchError);
        // If no profile exists yet, return empty profile
        if (fetchError.code === 'PGRST116') {
          setProfile({
            ...DEFAULT_PROFILE,
            id: user.id,
            email: user.email || '',
          });
        } else {
          setError(fetchError.message);
        }
        return;
      }

      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      
      const addressParts = [data.address, data.city, data.state, data.zip].filter(Boolean);
      const formattedAddress = data.address 
        ? `${data.address}${data.city || data.state || data.zip ? ', ' : ''}${[data.city, data.state, data.zip].filter(Boolean).join(', ')}`
        : '';

      const profileData: ClientProfileData = {
        id: data.id,
        email: data.email || user.email || '',
        firstName,
        lastName,
        fullName,
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        formattedAddress,
        stripeCustomerId: data.stripe_customer_id,
        createdAt: data.created_at,
      };

      console.log('[USE_CLIENT_PROFILE] Profile loaded:', {
        hasName: !!fullName,
        hasPhone: !!profileData.phone,
        hasAddress: !!profileData.address,
      });

      setProfile(profileData);
    } catch (err: any) {
      console.error('[USE_CLIENT_PROFILE] Error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      console.log('[USE_CLIENT_PROFILE] Received profileUpdated event');
      // Small delay to ensure database write is complete
      setTimeout(() => {
        fetchProfile();
      }, 500);
    };

    const handleAddressUpdated = (event: Event) => {
      console.log('[USE_CLIENT_PROFILE] Received addressUpdated event');
      // Small delay to ensure database write is complete
      setTimeout(() => {
        fetchProfile();
      }, 500);
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    window.addEventListener('addressUpdated', handleAddressUpdated);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
      window.removeEventListener('addressUpdated', handleAddressUpdated);
    };
  }, [fetchProfile]);

  const refresh = useCallback(async () => {
    console.log('[USE_CLIENT_PROFILE] Manual refresh triggered');
    setLoading(true);
    await fetchProfile();
  }, [fetchProfile]);

  // Computed properties
  const hasProfileData = !!(profile?.firstName && profile?.lastName);
  const hasAddressData = !!(profile?.address && profile?.city && profile?.state && profile?.zip);

  return {
    profile,
    loading,
    error,
    refresh,
    hasProfileData,
    hasAddressData,
  };
};

export default useClientProfile;
