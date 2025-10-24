import React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import UnifiedAuth from '@/components/auth/UnifiedAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function UnifiedLogin() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Determine user type based on URL path
  const getUserTypeFromPath = (pathname: string): 'client' | 'landscaper' | 'admin' => {
    if (pathname.includes('admin')) return 'admin';
    if (pathname.includes('landscaper') || pathname.includes('pro')) return 'landscaper';
    return 'client';
  };
  
  const userType = (searchParams.get('type') as 'client' | 'landscaper' | 'admin') || 
                  getUserTypeFromPath(location.pathname);
  const tab = (searchParams.get('tab') as 'login' | 'signup') || 
             (location.pathname.includes('signup') ? 'signup' : 'login');

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <Header />
      <main className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <UnifiedAuth 
            defaultTab={tab}
            userType={userType}
            onBack={() => window.history.back()}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}