import { useState, useEffect } from 'react';
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

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileCompletionData>({
    percentage: 0,
    items: [],
    completedCount: 0,
    totalCount: 5
  });
  const [loading, setLoading] = useState(true);

  const checkProfileCompletion = async () => {
    if (!user) {
      setData({
        percentage: 0,
        items: [],
        completedCount: 0,
        totalCount: 5
      });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      // Get user profile data from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, address, stripe_customer_id')
        .eq('id', user.id)
        .single();

      // Check for payment methods by calling Stripe if customer exists
      let hasPaymentMethod = false;
      if (profile?.stripe_customer_id) {
        try {
          const { data: methodsResult } = await supabase.functions.invoke('list-payment-methods', {
            body: { customerId: profile.stripe_customer_id }
          });
          hasPaymentMethod = methodsResult?.success && methodsResult?.payment_methods?.length > 0;
        } catch (error) {
          console.log('Could not check payment methods:', error);
          hasPaymentMethod = false;
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

      setData({
        percentage,
        items,
        completedCount,
        totalCount: items.length
      });


    } catch (error) {
      console.error('Error checking profile completion:', error);
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
  };

  useEffect(() => {
    checkProfileCompletion();
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      checkProfileCompletion();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [user]);

  const refresh = () => {
    checkProfileCompletion();
  };

  return { ...data, loading, refresh };
};