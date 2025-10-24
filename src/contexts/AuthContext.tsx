import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signOutAndRedirect } from '../lib/logout';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  signOut: async () => {},
  refreshUserRole: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthContext = useAuth; // Export alias for compatibility

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get user role from database using user ID
  const getUserRole = async (user: User): Promise<string | null> => {
    try {
      console.log('🔍 Looking up role for user ID:', user.id);
      
      // First try user metadata from session
      const roleFromMetadata = user.user_metadata?.role;
      if (roleFromMetadata) {
        console.log('✅ Got role from metadata:', roleFromMetadata);
        return roleFromMetadata;
      }
      
      // Fallback to database lookup using user ID
      console.log('🔍 No role in metadata, querying database...');
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('❌ Database role lookup error:', error);
        return 'client'; // Safe fallback
      }
      
      if (userData?.role) {
        console.log('✅ Got role from database:', userData.role);
        return userData.role;
      }
      
      console.log('🔍 No role found, defaulting to client');
      return 'client'; // Safe fallback
    } catch (error) {
      console.error('❌ Exception in getUserRole:', error);
      return 'client'; // Safe fallback
    }
  };

  // Ensure user record exists in public.users table
  const ensureUserRecord = async (authUser: User): Promise<void> => {
    try {
      if (!authUser.id || !authUser.email) return;
      
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();
      
      if (existingUser) {
        return; // User already exists
      }
      
      // Upsert user record (insert or update if exists)
      const { error } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          role: authUser.user_metadata?.role || 'client',
          first_name: authUser.user_metadata?.first_name || null,
          last_name: authUser.user_metadata?.last_name || null
        }, {
          onConflict: 'id'
        });

      
      if (error) {
        console.error('❌ Error creating user record:', error);
      } else {
        console.log('✅ Created user record for:', authUser.email);
      }
    } catch (error) {
      console.error('❌ Exception in ensureUserRecord:', error);
    }
  };

  const refreshUserRole = async () => {
    if (!user) return;
    
    console.log('🔄 Refreshing user role for:', user.email);
    const role = await getUserRole(user);
    setUserRole(role);
  };

  const signOut = async () => {
    try {
      console.log('🔄 AuthContext signOut called');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      setUserRole(null);
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Exception during sign out:', error);
      // Force redirect even on error
      window.location.href = '/';
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user?.email) {
        // Ensure user record exists
        await ensureUserRecord(session.user);
        
        // Get user role
        const role = await getUserRole(session.user);
        if (mounted) {
          setUserRole(role);
          
          // Handle redirect after successful login (only on SIGNED_IN event)
          if (event === 'SIGNED_IN' && role) {
            console.log('✅ Login successful, redirecting based on role:', role);
            
            // Determine redirect path based on role
            const redirectPath = 
              role === 'admin' ? '/admin-dashboard' :
              role === 'landscaper' ? '/landscaper-dashboard' :
              '/client-dashboard';
            
            console.log('🔀 Redirecting to:', redirectPath);
            
            // Use a small delay to ensure state is updated
            setTimeout(() => {
              window.location.href = redirectPath;
            }, 100);
          }
        }
      } else {
        if (mounted) {
          setUserRole(null);
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        handleAuthStateChange('INITIAL_SESSION', session);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    role: userRole,
    signOut,
    refreshUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
