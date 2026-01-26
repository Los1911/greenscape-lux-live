// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { signOutAndRedirect } from "@/lib/logout";

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

/**
 * Primary hook (new standard)
 */
export const useAuth = () => useContext(AuthContext);

/**
 * Legacy compatibility hook
 * Required for existing payment pages and older imports
 */
export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // --------------------------------------
  // SIMPLE ROLE RESOLUTION (NO DATABASE)
  // --------------------------------------
  const extractRole = (user: User | null) => {
    return user?.user_metadata?.role ?? null;
  };

  const refreshUserRole = async () => {
    setRole(extractRole(user));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    signOutAndRedirect();
  };

  // Load session once
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setRole(extractRole(data.session?.user ?? null));
      setLoading(false);
    };

    init();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setRole(extractRole(session?.user ?? null));
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        signOut,
        refreshUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
