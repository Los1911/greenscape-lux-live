import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalLogout } from '@/utils/globalLogout';
import { supabase } from '@/lib/supabase';

export default function AuthMenu() {
  const [open, setOpen] = useState(false);
  const [hasClient, setHasClient] = useState(false);
  const [hasPro, setHasPro] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Listen to auth state changes globally
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Get role from user metadata or database
        const userRole = session.user.user_metadata?.role;
        if (userRole) {
          setRole(userRole);
        } else {
          // Fallback to database lookup
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          setRole(userData?.role || 'client');
        }
      } else {
        setRole(null);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const userRole = session.user.user_metadata?.role;
        setRole(userRole || 'client');
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && role) {
      setHasClient(role === 'client' || role === 'admin');
      setHasPro(role === 'landscaper' || role === 'admin');
    } else {
      setHasClient(false);
      setHasPro(false);
    }
  }, [user, role]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const logout = async () => {
    setOpen(false);
    await globalLogout('/portal-login');
  };


  // Don't render if not authenticated
  if (!user?.email) {
    return null;
  }

  const showBothPortals = hasClient && hasPro;

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="px-3 py-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/30 transition-all duration-200 hover:shadow-[0_0_30px_rgba(52,211,153,0.25)] max-w-[200px] sm:max-w-none"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Show full email on larger screens, truncated on mobile */}
        <span className="hidden sm:inline">{user.email}</span>
        <span className="sm:hidden">
          {user.email.length > 15 ? `${user.email.substring(0, 12)}...` : user.email}
        </span>
      </button>
      
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0B0F0D] ring-1 ring-emerald-500/30 shadow-xl shadow-emerald-500/10 p-2 z-50"
          role="menu"
        >
          {showBothPortals && (
            <div className="px-4 py-2 text-emerald-400 text-sm font-medium">
              Switch Portal
            </div>
          )}
          
          {hasClient && (
            <button
              className="w-full text-left px-4 py-3 rounded-xl text-emerald-300 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(52,211,153,0.1)] transition-all duration-200"
              onClick={() => { setOpen(false); navigate('/client-dashboard'); }}
              role="menuitem"
            >
              Client Dashboard
            </button>
          )}

          {hasPro && (
            <button
              className="w-full text-left px-4 py-3 rounded-xl text-emerald-300 hover:bg-emerald-500/10 hover:shadow-[0_0_15px_rgba(52,211,153,0.1)] transition-all duration-200"
              onClick={() => { setOpen(false); navigate('/landscaper-dashboard'); }}
              role="menuitem"
            >
              Pro Dashboard
            </button>
          )}
          
          {(hasClient || hasPro) && (
            <div className="my-2 h-px bg-emerald-500/20" />
          )}
          
          <button
            className="w-full text-left px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
            onClick={logout}
            role="menuitem"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}