import React, { useState } from 'react';
import { Bell, LogOut, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { signOutAndRedirect } from '@/lib/logout';
import { useMobile } from '@/hooks/use-mobile';

interface DashboardHeaderProps {
  type: 'client' | 'landscaper';
  clientName?: string;
  showNotifications?: boolean;
  showBackButton?: boolean;
}

export default function DashboardHeader({ 
  type, 
  clientName, 
  showNotifications = true, 
  showBackButton = false 
}: DashboardHeaderProps) {
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  
  const handleLogout = async () => {
    try {
      console.log("Dashboard logout initiated");
      const redirectPath = type === 'client' ? '/client-login' : '/';
      await signOutAndRedirect(supabase, redirectPath);
    } catch (error) {
      console.error("Dashboard logout error:", error);
      // Force redirect even if logout fails
      window.location.href = type === 'client' ? '/client-login' : '/';
    }
  };

  const handleBack = () => {
    // Use explicit navigation instead of navigate(-1)
    const currentPath = window.location.pathname;
    if (currentPath.includes('/client/')) {
      navigate('/client/dashboard');
    } else if (currentPath.includes('/landscaper')) {
      navigate('/landscaper-dashboard');
    } else {
      navigate('/');
    }
  };
  if (type === 'landscaper') {
    return (
      <header className="flex justify-between items-center p-4 bg-black border-b border-green-500 shadow-lg shadow-green-500/20">
        {showBackButton && (
          <button 
            onClick={handleBack}
            className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}
        
        <div className="flex items-center">
          <span className="text-green-400 font-bold text-xl">GreenScape Lux</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="text-green-400 hover:text-green-300 transition-colors duration-200"
        >
          Logout
        </button>
      </header>
    );
  }

  // Client header with mobile optimizations
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
                {clientName || 'Client'}
              </span>
            </h1>
            <p className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base'}`}>Your luxury landscaping dashboard</p>
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
              {showNotifications && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                    className="relative p-2 rounded-full hover:bg-green-900/20"
                  >
                    <Bell className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-green-400`} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </Button>
                  
                  {showNotificationsPanel && (
                    <div className={`absolute ${isMobile ? 'right-0 w-72' : 'right-0 w-80'} top-12 bg-black/90 border border-green-500/25 rounded-xl shadow-[0_0_25px_rgba(34,197,94,0.3)] z-50 max-h-96 overflow-hidden`}>
                      <div className="p-4 border-b border-green-500/20">
                        <h3 className="text-green-300 font-semibold text-sm">Recent Updates</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                        <div className="p-3 bg-green-900/20 rounded-lg">
                          <p className="text-white text-xs">Your lawn care service is scheduled for tomorrow at 10 AM</p>
                          <p className="text-gray-400 text-xs mt-1">2 hours ago</p>
                        </div>
                        <div className="p-3 bg-blue-900/20 rounded-lg">
                          <p className="text-white text-xs">Quote request submitted successfully</p>
                          <p className="text-gray-400 text-xs mt-1">1 day ago</p>
                        </div>
                        <div className="p-3 bg-yellow-900/20 rounded-lg">
                          <p className="text-white text-xs">Payment reminder: Invoice due in 3 days</p>
                          <p className="text-gray-400 text-xs mt-1">2 days ago</p>
                        </div>
                      </div>
                      <div className="p-3 border-t border-green-500/20 text-center">
                        <button className="text-green-400 text-xs hover:text-green-300">
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/chat')}
                  className="p-2 rounded-full hover:bg-green-900/20"
                >
                  <MessageCircle className="w-5 h-5 text-green-400" />
                </Button>
              )}
              
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