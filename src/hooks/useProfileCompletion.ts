import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileCompletionItem {
  id: string;
  label: string;
  completed: boolean;
  action?: string;
}

interface ProfileCompletionData {
  percentage: number;
  items: ProfileCompletionItem[];
  completedCount: number;
  totalCount: number;
}

// Local storage key for tracking recently added payment methods
const PAYMENT_METHOD_ADDED_KEY = 'greenscape_payment_method_added';

export const useProfileCompletion = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [data, setData] = useState<ProfileCompletionData>({
    percentage: 0,
    items: [],
    completedCount: 0,
    totalCount: 5
  });
  const [loading, setLoading] = useState(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Check if a payment method was recently added (within last 5 minutes)
  const wasPaymentMethodRecentlyAdded = useCallback(() => {
    try {
      const stored = localStorage.getItem(PAYMENT_METHOD_ADDED_KEY);
      if (stored) {
        const timestamp = parseInt(stored, 10);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (timestamp > fiveMinutesAgo) {
          console.log('[PROFILE_COMPLETION] Payment method was recently added (localStorage flag)');
          return true;
        }
        // Clean up old entry
        localStorage.removeItem(PAYMENT_METHOD_ADDED_KEY);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return false;
  }, []);

  // Mark that a payment method was just added
  const markPaymentMethodAdded = useCallback(() => {
    try {
      localStorage.setItem(PAYMENT_METHOD_ADDED_KEY, Date.now().toString());
      console.log('[PROFILE_COMPLETION] Marked payment method as added in localStorage');
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const checkProfileCompletion = useCallback(async (forceRetry = false) => {
    // Guard: Wait for auth
    if (authLoading) {
      console.log('[PROFILE_COMPLETION] Waiting for auth');
      return;
    }

    if (!user || !session) {
      console.log('[PROFILE_COMPLETION] No user/session');
      setData({
        percentage: 0,
        items: [],
        completedCount: 0,
        totalCount: 5
      });
      setLoading(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl) {
      console.error('[PROFILE_COMPLETION] Supabase URL not configured');
      setLoading(false);
      return;
    }

    try {
      console.log('[PROFILE_COMPLETION] Fetching profile data for user:', user.id);
      setLoading(true);
      
      // Get user profile data from profiles table - use fresh fetch
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, address, stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[PROFILE_COMPLETION] Profile fetch error:', profileError);
      }

      console.log('[PROFILE_COMPLETION] Profile data:', {
        hasProfile: !!profile,
        stripe_customer_id: profile?.stripe_customer_id,
        hasName: !!(profile?.first_name && profile?.last_name),
        hasPhone: !!profile?.phone,
        hasAddress: !!profile?.address
      });

      // Check for payment methods by calling Stripe if customer exists
      let hasPaymentMethod = false;
      
      // First check if we recently added a payment method (optimistic update)
      const recentlyAdded = wasPaymentMethodRecentlyAdded();
      
      if (profile?.stripe_customer_id) {
        try {
          console.log('[PROFILE_COMPLETION] Checking payment methods for customer:', profile.stripe_customer_id);
          
          // Use direct fetch to call the edge function (same approach as StripePaymentMethodManager)
          const functionUrl = `${supabaseUrl}/functions/v1/get-payment-methods`;
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          };
          
          if (anonKey) {
            headers['apikey'] = anonKey;
          }
          
          console.log('[PROFILE_COMPLETION] Calling edge function:', functionUrl);
          
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ customerId: profile.stripe_customer_id })
          });

          console.log('[PROFILE_COMPLETION] Edge function response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[PROFILE_COMPLETION] Edge function error:', response.status, errorText);
            // If we recently added a payment method, assume it exists
            if (recentlyAdded) {
              console.log('[PROFILE_COMPLETION] Using optimistic update - payment method recently added');
              hasPaymentMethod = true;
            }
          } else {
            const methodsResult = await response.json();
            console.log('[PROFILE_COMPLETION] Edge function result:', JSON.stringify(methodsResult));
            
            // The edge function returns { success: true, payment_methods: [...] }
            // payment_methods is an array of Stripe payment method objects
            const paymentMethods = methodsResult?.payment_methods || methodsResult?.paymentMethods || [];
            
            console.log('[PROFILE_COMPLETION] Payment methods array:', {
              isArray: Array.isArray(paymentMethods),
              length: paymentMethods?.length,
              success: methodsResult?.success
            });
            
            // Check if we have at least one payment method
            hasPaymentMethod = Array.isArray(paymentMethods) && paymentMethods.length > 0;
            
            console.log('[PROFILE_COMPLETION] Has payment method:', hasPaymentMethod);
            
            // If we recently added but API says no methods, retry a few times
            if (recentlyAdded && !hasPaymentMethod && retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              console.log('[PROFILE_COMPLETION] Payment method recently added but not found, retrying...', retryCountRef.current);
              setTimeout(() => checkProfileCompletion(true), 2000);
              return;
            }
            
            // If we found payment methods, clear the recently added flag
            if (hasPaymentMethod) {
              try {
                localStorage.removeItem(PAYMENT_METHOD_ADDED_KEY);
              } catch (e) {
                // Ignore
              }
              retryCountRef.current = 0;
            }
          }
        } catch (error) {
          console.error('[PROFILE_COMPLETION] Could not check payment methods:', error);
          // If we recently added a payment method, assume it exists
          if (recentlyAdded) {
            console.log('[PROFILE_COMPLETION] Using optimistic update after error - payment method recently added');
            hasPaymentMethod = true;
          }
        }
      } else {
        console.log('[PROFILE_COMPLETION] No stripe_customer_id found, skipping payment method check');
        
        // If we recently added a payment method but no stripe_customer_id yet, retry
        if (recentlyAdded && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log('[PROFILE_COMPLETION] Payment method recently added but no customer ID, retrying...', retryCountRef.current);
          setTimeout(() => checkProfileCompletion(true), 2000);
          return;
        }
        
        // Use optimistic update if recently added
        if (recentlyAdded) {
          hasPaymentMethod = true;
        }
      }

      const items: ProfileCompletionItem[] = [
        {
          id: 'email_verified',
          label: 'Verified email',
          completed: !!user.email_confirmed_at,
        },
        {
          id: 'full_name',
          label: 'First + Last name',
          completed: !!(profile?.first_name && profile?.last_name),
          action: 'edit_profile'
        },
        {
          id: 'phone_number',
          label: 'Phone number',
          completed: !!profile?.phone,
          action: 'edit_profile'
        },
        {
          id: 'service_address',
          label: 'Default service address',
          completed: !!profile?.address,
          action: 'add_address'
        },
        {
          id: 'payment_method',
          label: 'Saved payment method',
          completed: hasPaymentMethod,
          action: 'add_payment'
        }
      ];

      const completedCount = items.filter(item => item.completed).length;
      const percentage = Math.round((completedCount / items.length) * 100);

      console.log('[PROFILE_COMPLETION] Final result:', {
        completedCount,
        totalCount: items.length,
        percentage,
        hasPaymentMethod,
        items: items.map(i => ({ id: i.id, completed: i.completed }))
      });

      setData({
        percentage,
        items,
        completedCount,
        totalCount: items.length
      });

    } catch (error) {
      console.error('[PROFILE_COMPLETION] Error checking profile completion:', error);
      // Fallback to empty state on error
      setData({
        percentage: 0,
        items: [],
        completedCount: 0,
        totalCount: 5
      });
    } finally {
      setLoading(false);
    }
  }, [user, session, authLoading, wasPaymentMethodRecentlyAdded]);

  useEffect(() => {
    checkProfileCompletion();
    
    // Listen for profile updates
    const handleProfileUpdate = (event: Event) => {
      console.log('[PROFILE_COMPLETION] Received profileUpdated event, refreshing...');
      
      // Check if this is a payment method update
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === 'payment_method_added') {
        markPaymentMethodAdded();
      }
      
      // Reset retry counter
      retryCountRef.current = 0;
      
      // Reduced delay for faster progress updates - database should be updated by now
      setTimeout(() => {
        checkProfileCompletion();
      }, 500);
    };
    
    // Listen for address updates specifically
    const handleAddressUpdate = (event: Event) => {
      console.log('[PROFILE_COMPLETION] Received addressUpdated event, refreshing...');
      retryCountRef.current = 0;
      // Faster refresh for address updates since they're simpler
      setTimeout(() => {
        checkProfileCompletion();
      }, 300);
    };
    
    // Listen for payment method added specifically
    const handlePaymentMethodAdded = () => {
      console.log('[PROFILE_COMPLETION] Received paymentMethodAdded event');
      markPaymentMethodAdded();
      retryCountRef.current = 0;
      setTimeout(() => {
        checkProfileCompletion();
      }, 1000); // Slightly longer for Stripe sync
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('addressUpdated', handleAddressUpdate);
    window.addEventListener('paymentMethodAdded', handlePaymentMethodAdded);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('addressUpdated', handleAddressUpdate);
      window.removeEventListener('paymentMethodAdded', handlePaymentMethodAdded);
    };
  }, [checkProfileCompletion, markPaymentMethodAdded]);


  const refresh = useCallback(() => {
    console.log('[PROFILE_COMPLETION] Manual refresh triggered');
    retryCountRef.current = 0;
    checkProfileCompletion();
  }, [checkProfileCompletion]);

  return { ...data, loading, refresh, markPaymentMethodAdded };
};
