import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { globalLogout } from '../utils/globalLogout';
import { syncUserProfile } from '../utils/profileSync';
import { SESSION_RECOVERED_EVENT } from '../utils/sessionRecovery';
import { ensureUserRecords } from '../lib/ensureUserRecords';
import { 
  isRecoverySession, 
  setRecoveryIntent,
  hasRecoveryIntent,
  detectRecoveryIntentFromUrl,
  clearPasswordResetFlag 
} from '../utils/passwordResetGuard';


const log = (area: string, msg: string, data?: any) => {
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}][AUTH_CTX:${area}] ${msg}`, data !== undefined ? data : '');
};

// Admin email allowlist - users with these emails get admin access
const ADMIN_EMAILS = [
  'admin.1@greenscapelux.com',
  'bgreen@greenscapelux.com'
];





interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: string | null;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true, role: null,
  signOut: async () => {}, refreshUserRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);
export const useAuthContext = useAuth;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(() => {
    try { return sessionStorage.getItem('user_role'); } catch { return null; }
  });
  
  const processingRef = useRef(false);
  const lastProcessedSessionRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  /**
   * AUTHORITATIVE ROLE RESOLUTION
   * 
   * Priority order:
   * 1. Check landscapers table FIRST (by user_id = auth.uid())
   *    - If landscaper record exists → return "landscaper" immediately
   * 2. Only if NO landscaper record → check profiles table
   *    - If profile.role === 'admin' → return "admin"
   *    - Otherwise → return "client"
   * 
   * This ensures users with valid landscaper records are NEVER misrouted to Client Dashboard.
   */
  const getUserRole = useCallback(async (user: User): Promise<string | null> => {
    try {
      log('ROLE', '=== AUTHORITATIVE ROLE RESOLUTION ===');
      log('ROLE', `User ID: ${user.id}, Email: ${user.email}`);

      // ========================================
      // STEP 1: Check landscapers table FIRST
      // This is the AUTHORITATIVE source for landscaper users
      // ========================================
      const { data: landscaperRecord, error: landscaperError } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      log('ROLE', `Landscaper check: found=${!!landscaperRecord}, error=${landscaperError?.message || 'none'}`);

      // If landscaper record exists, IMMEDIATELY return landscaper role
      // Do NOT check profiles.role or user_metadata - landscapers table is authoritative
      if (landscaperRecord && !landscaperError) {
        log('ROLE', '✅ LANDSCAPER RECORD FOUND - Returning landscaper role');
        return 'landscaper';
      }

      // Log landscaper query error but continue to profile check
      if (landscaperError) {
        log('ROLE', `⚠️ Landscaper query error (continuing): ${landscaperError.message}`);
      }

      // ========================================
      // STEP 2: No landscaper record - check profiles table
      // ========================================
      log('ROLE', 'No landscaper record found, checking profiles table...');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      log('ROLE', `Profile check: role=${profileData?.role || 'none'}, error=${profileError?.message || 'none'}`);

      // Handle profile query error
      if (profileError) {
        log('ROLE', `❌ Profile query error: ${profileError.message}`);
        // Fallback to client role on error
        return 'client';
      }

      // Determine role from profile
      let resolvedRole = 'client'; // Default to client

      if (profileData?.role === 'admin') {
        resolvedRole = 'admin';
      } else if (profileData?.role === 'landscaper') {
        // Profile says landscaper but no landscaper record exists
        // This is a data inconsistency - default to client for safety
        log('ROLE', '⚠️ Profile role is landscaper but no landscaper record exists - defaulting to client');
        resolvedRole = 'client';
      } else {
        resolvedRole = 'client';
      }

      // Admin override for allowlisted emails
      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        log('ROLE', `🔐 Admin override for ${user.email}`);
        resolvedRole = 'admin';
      }


      log('ROLE', `🎯 Final Resolved Role: ${resolvedRole}`);
      return resolvedRole;

    } catch (error) {
      log('ROLE', `❌ Exception in getUserRole: ${error}`);
      // Return client as safe fallback on exception
      return 'client';
    }
  }, []);

  const refreshUserRole = useCallback(async () => {
    if (!user) return;
    log('ROLE', 'Refreshing user role...');
    const role = await getUserRole(user);
    setUserRole(role);
    try { sessionStorage.setItem('user_role', role || ''); } catch {}
    log('ROLE', `Role refreshed: ${role}`);
  }, [user, getUserRole]);

  const signOut = useCallback(async () => {
    log('SIGNOUT', 'Delegating to globalLogout');
    await globalLogout('/portal-login');
  }, []);

  // Handle session recovery events from sessionRecovery.ts
  useEffect(() => {
    const handleSessionRecovered = async (event: CustomEvent) => {
      log('RECOVERY', 'Session recovered event received', event.detail);
      
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession && mountedRef.current) {
          setSession(currentSession);
          setUser(currentSession.user);
          setLoading(false);
          
          // Always refresh role on session recovery to ensure authoritative resolution
          const role = await getUserRole(currentSession.user);
          if (mountedRef.current) {
            setUserRole(role);
            try { sessionStorage.setItem('user_role', role || ''); } catch {}
          }
        }
      } catch (err) {
        log('RECOVERY', 'Error during recovery:', err);
        if (mountedRef.current) setLoading(false);
      }
    };

    window.addEventListener(SESSION_RECOVERED_EVENT, handleSessionRecovered as EventListener);
    return () => {
      window.removeEventListener(SESSION_RECOVERED_EVENT, handleSessionRecovered as EventListener);
    };
  }, [getUserRole]);

  useEffect(() => {
    mountedRef.current = true;
    log('INIT', '=== AuthProvider MOUNTING ===');

    // SAFETY TIMEOUT: Force loading=false after 5s to prevent white screen
    loadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && loading) {
        log('TIMEOUT', '⚠️ SAFETY TIMEOUT - forcing loading=false after 5s');
        setLoading(false);
      }
    }, 5000);

    const processSession = async (event: string, sess: Session | null) => {
      if (!mountedRef.current) return;
      
      const sessionId = sess?.access_token?.slice(-10) || 'none';
      log('PROCESS', `Event: ${event}, sessionId: ${sessionId}`);
      
      // Skip duplicate processing
      if (sess && lastProcessedSessionRef.current === sessionId && event !== 'SIGNED_OUT') {
        log('PROCESS', 'SKIP - Already processed this session');
        if (mountedRef.current) setLoading(false);
        return;
      }
      
      try {
        setSession(sess);
        setUser(sess?.user || null);
        
        if (sess?.user) {
          lastProcessedSessionRef.current = sessionId;
          
          // PASSWORD RESET GUARD: Log recovery session detection
          // NOTE: We do NOT set recovery intent here - that is only set from URL parameters
          // The guard requires BOTH recovery_sent_at AND recovery_intent (from URL) to trigger
          if (isRecoverySession(sess)) {
            log('RECOVERY', '🔒 Recovery session detected (recovery_sent_at present)');
            // Recovery intent is set by URL detection in landing/reset pages, not here
          }

          // IMPORTANT: Always use authoritative role resolution
          // Do NOT trust cached role for landscapers - always verify
          const cachedRole = sessionStorage.getItem('user_role');
          
          // If cached role is landscaper, verify it's still valid
          // Otherwise, use authoritative resolution
          if (cachedRole === 'landscaper') {
            log('ROLE', '🔍 Cached role is landscaper - verifying with authoritative check...');
            // Quick verification that landscaper record still exists
            const { data: landscaperRecord } = await supabase
              .from('landscapers')
              .select('id')
              .eq('user_id', sess.user.id)
              .maybeSingle();
            
            if (landscaperRecord) {
              log('ROLE', '✅ Landscaper record verified - using cached role');
              if (mountedRef.current) {
                setUserRole('landscaper');
                setLoading(false);
              }
            } else {
              log('ROLE', '⚠️ Landscaper record not found - re-resolving role');
              const role = await getUserRole(sess.user);
              if (mountedRef.current) {
                setUserRole(role);
                try { sessionStorage.setItem('user_role', role || ''); } catch {}
                setLoading(false);
              }
            }
          } else if (cachedRole && ['admin', 'client'].includes(cachedRole)) {
            // For admin/client, first check if they should actually be a landscaper
            log('ROLE', `Cached role is ${cachedRole} - checking for landscaper record first...`);
            const { data: landscaperRecord } = await supabase
              .from('landscapers')
              .select('id')
              .eq('user_id', sess.user.id)
              .maybeSingle();
            
            if (landscaperRecord) {
              log('ROLE', '✅ LANDSCAPER RECORD FOUND - overriding cached role');
              if (mountedRef.current) {
                setUserRole('landscaper');
                try { sessionStorage.setItem('user_role', 'landscaper'); } catch {}
                setLoading(false);
              }
            } else {
              // No landscaper record, use cached role
              log('ROLE', `No landscaper record - using cached role: ${cachedRole}`);
              if (mountedRef.current) {
                setUserRole(cachedRole);
                setLoading(false);
              }
            }
          } else {
            // No cached role or invalid - do full authoritative resolution
            log('ROLE', 'No valid cached role - performing full authoritative resolution');
            const role = await getUserRole(sess.user);
            if (mountedRef.current) {
              setUserRole(role);
              try { sessionStorage.setItem('user_role', role || ''); } catch {}
              setLoading(false);
            }
          }
          
          // SYSTEM STABILIZATION: Ensure user records exist after login/signup
          // This guarantees users, clients, and landscapers tables are populated
          const userMetaRole = sess.user.user_metadata?.role as string || 'client';
          ensureUserRecords({ 
            role: userMetaRole === 'landscaper' ? 'landscaper' : 'client',
            firstName: sess.user.user_metadata?.first_name,
            lastName: sess.user.user_metadata?.last_name,
            phone: sess.user.user_metadata?.phone
          }).then(result => {
            if (result.success) {
              log('ENSURE', `✅ User records ensured: users=${result.usersCreated}, clients=${result.clientsCreated}, landscapers=${result.landscapersCreated}`);
            } else {
              log('ENSURE', `⚠️ User records ensure failed: ${result.error}`);
            }
          }).catch(err => {
            log('ENSURE', `❌ User records ensure exception: ${err}`);
          });
          
          // Background sync - don't block loading
          syncUserProfile(sess.user.id, sess.user.email || '').catch(() => {});
          

        } else {
          // User signed out - clear password reset flags
          clearPasswordResetFlag();
          setUserRole(null);
          lastProcessedSessionRef.current = null;
          try { sessionStorage.removeItem('user_role'); } catch {}
          if (mountedRef.current) setLoading(false);
        }
      } catch (err) {
        log('PROCESS', 'Error processing session:', err);
        if (mountedRef.current) setLoading(false);
      }
    };


    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      log('AUTH_CHANGE', `Event: ${event}`);
      if (initialLoadDoneRef.current || event !== 'INITIAL_SESSION') {
        processSession(event, session);
      }
    });

    // Initial session fetch - this is the primary way to get session on refresh
    const initializeAuth = async () => {
      try {
        log('INIT', 'Fetching initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          log('INIT', 'Session fetch error:', error.message);
        }
        
        initialLoadDoneRef.current = true;
        await processSession('INITIAL_SESSION', session);
      } catch (err) {
        log('INIT', 'Unexpected error:', err);
        if (mountedRef.current) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [getUserRole]);

  // Extra safety: If we have a user but loading is stuck, force it off
  useEffect(() => {
    if (user && loading) {
      const timer = setTimeout(() => {
        if (mountedRef.current && loading) {
          log('SAFETY', 'User exists but loading stuck - forcing off');
          setLoading(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  return (
    <AuthContext.Provider value={{ user, session, loading, role: userRole, signOut, refreshUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};
