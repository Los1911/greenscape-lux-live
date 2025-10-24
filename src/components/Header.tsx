import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import AuthMenu from '@/components/AuthMenu';
import { useAuth } from '@/contexts/AuthContext';

const Header = ({ showNavigation = true }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="relative z-20 bg-black border-b border-emerald-400/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center min-w-0 flex-shrink">
            <Logo size="small" className="w-12 h-12 flex-shrink-0" />
            <span className="ml-3 text-xl font-bold text-white hidden sm:block">GreenScape Lux</span>
            <span className="ml-2 text-lg font-bold text-white sm:hidden">GreenScape</span>
          </Link>

          <div className="flex items-center space-x-4 flex-shrink-0">
            {user && (
              <AuthMenu />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;