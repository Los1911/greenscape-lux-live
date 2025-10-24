import React, { useState } from 'react';
import { Bell, LogOut, MessageCircle, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { signOutAndRedirect } from '@/lib/logout';
import { useMobile } from '@/hooks/use-mobile';
import { NotificationBell } from '../notifications/NotificationBell';

import { LiveNotificationSystem } from '../notifications/LiveNotificationSystem';

interface UnifiedDashboardHeaderProps {
  type: 'client' | 'landscaper' | 'admin';
  userName?: string;
  showNotifications?: boolean;
  showBackButton?: boolean;
  variant?: 'modern' | 'classic';
}

export default function UnifiedDashboardHeader({ 
  type, 
  userName, 
  showNotifications = true, 
  showBackButton = false,
  variant = 'modern'
}: UnifiedDashboardHeaderProps) {
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  
  const handleLogout = async () => {
    try {
      console.log(`${type} logout initiated`);
      const redirectPath = type === 'client' ? '/client-login' : '/';
      await signOutAndRedirect(supabase, redirectPath);
    } catch (error) {
      console.error(`${type} logout error:`, error);
      window.location.href = type === 'client' ? '/client-login' : '/';
    }
  };

  const handleBack = () => {
    // Use explicit navigation instead of navigate(-1)
    const currentPath = window.location.pathname;
    if (currentPath.includes('/client')) {
      navigate('/client-dashboard');
    } else if (currentPath.includes('/landscaper')) {
      navigate('/landscaper-dashboard/overview');
    } else if (currentPath.includes('/admin')) {
      navigate('/admin-dashboard');
    } else {
      navigate('/');
    }
  };
  // Classic variant for landscaper/admin
  if (variant === 'classic') {
    return (
      <>
        <LiveNotificationSystem />
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {type === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                </h1>
                <p className="text-gray-600">
                  Welcome back{userName ? `, ${userName}` : ''}! Here's your overview.
                </p>
              </div>
              <div className="flex items-center gap-4">
                {showNotifications && <NotificationBell />}

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
      </>
    );
  }

  // Modern variant for client
  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_45px_-20px_rgba(34,197,94,0.35)] mb-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 animate-pulse"></div>
      <div className={`${isMobile ? 'p-4' : 'p-6'} relative`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'}`}>
          <div className={isMobile ? 'text-center' : ''}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-semibold mb-2 leading-tight`}>
              <span className="text-white">Welcome back,</span>
              {!isMobile && <br className="md:hidden" />}
              <span className={`text-green-400 font-extrabold tracking-tight drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] ${isMobile ? 'block mt-1' : 'ml-2 md:ml-3'}`}>
                {userName || 'User'}
              </span>
            </h1>
            <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'}`}>
              Your luxury {type} dashboard
            </p>
          </div>
          
          <div className={`flex items-center ${isMobile ? 'justify-between' : 'gap-4'}`}>
            <div className={`${isMobile ? 'text-left' : 'text-right'}`}>
              <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]`}>
                {isMobile ? 'GreenScape' : 'GreenScape Lux'}
              </div>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>
                {isMobile ? 'Premium' : 'Premium Services'}
              </div>
            </div>
            
            
            <div className="flex items-center gap-2">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-2 rounded-full hover:bg-green-900/20"
                >
                  <ArrowLeft className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-400`} />
                </Button>
              )}

              {showNotifications && <NotificationBell />}

              <Button
                onClick={handleLogout}
                size={isMobile ? "sm" : "default"}
                className="rounded-full bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all duration-300"
              >
                <LogOut className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
                {isMobile ? 'Out' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
