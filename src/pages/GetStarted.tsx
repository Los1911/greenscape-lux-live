import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function GetStarted() {
  const navigate = useNavigate();
  return (
    <div 
      className="bg-black relative overflow-hidden flex flex-col"
      style={{
        minHeight: '100dvh',
        /* Fallback for browsers that don't support dvh */
        minHeight: '100svh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <AnimatedBackground />
      <Header />
      
      {/* Main content - flexbox centered */}
      <div 
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-6"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="w-full max-w-2xl">
          {/* Portal Header */}
          <div className="text-center mb-12 space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-500">
              Welcome to GreenScape Lux
            </h1>
            <p className="text-gray-300 text-xl md:text-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              Access your account to get started
            </p>
          </div>

          {/* Single Portal Button */}
          <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Button 
              onClick={() => navigate('/portal-login')}
              className="w-full max-w-md bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold py-8 px-12 rounded-2xl transition-all duration-300 transform hover:scale-[1.05] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] shadow-2xl shadow-emerald-500/50 flex items-center justify-center text-xl group"
            >
              <LogIn className="w-7 h-7 mr-3 group-hover:animate-pulse" />
              Access GreenScape Lux Portal
            </Button>
            <p className="text-gray-400 text-center text-base max-w-md">
              Log in or sign up to manage your account, request services, or join our network of elite professionals
            </p>
          </div>

          {/* Bottom Help Text */}
          <div className="text-center mt-16">
            <p className="text-gray-500 text-sm">
              Need assistance? Contact our support team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
