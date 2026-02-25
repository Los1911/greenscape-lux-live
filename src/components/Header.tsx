import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import AuthMenu from '@/components/AuthMenu';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { supabase } from '@/lib/supabase';

const Header = ({ showNavigation = true }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Listen to auth state changes globally (works on all pages)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="site-header relative z-20 bg-black border-b border-emerald-400/20" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between min-h-[44px] sm:min-h-[48px] gap-2">
          {/* Logo section - allow shrinking on mobile */}
          <Link to="/" className="flex items-center min-w-0 flex-shrink">
            <Logo size="small" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
            <span className="ml-2 sm:ml-3 text-base sm:text-xl font-bold text-white truncate max-w-[120px] sm:max-w-none">
              <span className="hidden sm:inline">GreenScape Lux</span>
              <span className="sm:hidden">GreenScape</span>
            </span>
          </Link>

          {/* Right side - notification bell and auth menu */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {user && (
              <>
                <div className="relative p-1 rounded-lg bg-gray-800/50 border border-emerald-400/20">
                  <NotificationBell />
                </div>
                <AuthMenu />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
