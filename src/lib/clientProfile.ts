import { supabase } from './supabase';

export interface ClientProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
}

export async function fetchClientProfile(): Promise<ClientProfile | null> {
  try {
    console.log('fetchClientProfile: Starting...');
    
    // Add timeout to auth.getUser()
    const authPromise = supabase.auth.getUser();
    const authTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout after 5 seconds')), 5000)
    );
    
    let user, authError;
    try {
      const result = await Promise.race([authPromise, authTimeoutPromise]) as any;
      user = result.data?.user;
      authError = result.error;
      console.log('fetchClientProfile: Auth user:', user, 'Error:', authError);
    } catch (timeoutError) {
      console.error('fetchClientProfile: Auth timeout:', timeoutError);
      return null;
    }
    
    if (authError || !user) {
      console.error('fetchClientProfile: Auth error:', authError);
      return null;
    }

    console.log('fetchClientProfile: User ID:', user.id, 'Email:', user.email);

    // Add timeout to database queries
    const queryTimeout = 3000; // 3 seconds

    // First try to get by user_id with timeout
    const userIdPromise = supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, address, stripe_customer_id')
      .eq('id', user.id)
      .single();
    
    const userIdTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('User ID query timeout')), queryTimeout)
    );

    let client, error;
    try {
      const result = await Promise.race([userIdPromise, userIdTimeoutPromise]) as any;
      client = result.data;
      error = result.error;
      console.log('fetchClientProfile: Query by user_id result:', client, 'Error:', error);
    } catch (timeoutError) {
      console.error('fetchClientProfile: User ID query timeout:', timeoutError);
      error = timeoutError;
    }

    // If not found by user_id, try by email with timeout
    if (error && user.email) {
      console.log('fetchClientProfile: Trying by email:', user.email);
      const emailPromise = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, address, stripe_customer_id')
        .eq('email', user.email)
        .single();
      
      const emailTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email query timeout')), queryTimeout)
      );
      
      try {
        const result = await Promise.race([emailPromise, emailTimeoutPromise]) as any;
        const clientByEmail = result.data;
        const emailError = result.error;
        
        console.log('fetchClientProfile: Query by email result:', clientByEmail, 'Error:', emailError);
        
        if (!emailError && clientByEmail) {
          client = clientByEmail;
          error = null;
          console.log('fetchClientProfile: Found client by email');
        }
      } catch (timeoutError) {
        console.error('fetchClientProfile: Email query timeout:', timeoutError);
      }
    }

    if (error || !client) {
      console.error('fetchClientProfile: Final error or no client:', error);
      // Return a default profile with user info if no client record exists
      if (user.email) {
        console.log('fetchClientProfile: Creating default profile from user data');
        return {
          id: user.id,
          user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone: user.user_metadata?.phone || '',
          created_at: user.created_at || new Date().toISOString()
        };
      }
      return null;
    }

    console.log('fetchClientProfile: Returning client:', client);
    return client;
  } catch (error) {
    console.error('fetchClientProfile: Catch block error:', error);
    return null;
  }
}

export function getClientFullName(client: ClientProfile | null): string {
  if (!client) return 'Client';
  
  const firstName = client.first_name || '';
  const lastName = client.last_name || '';
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  
  return firstName || lastName || client.email?.split('@')[0] || 'Client';
}