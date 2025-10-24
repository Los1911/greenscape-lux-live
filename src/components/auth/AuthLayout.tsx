import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlobalNavigation from '@/components/navigation/GlobalNavigation';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backLink?: string;
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  showBackButton = true, 
  backLink = '/get-started' 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-gray-900 to-black">
      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Navigation */}
          <div className="mb-6">
            <GlobalNavigation 
              showBack={showBackButton}
              customBackPath={backLink}
              className="justify-start"
            />
          </div>

          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-emerald-400 mb-2">
                GreenScape Lux
              </h1>
            </Link>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-emerald-500/20 rounded-lg p-6">
            {children}
          </div>
          
          {/* Footer */}
          <div className="text-center mt-6 text-gray-400 text-sm">
            <p>
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-emerald-400 hover:text-emerald-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="max-w-lg text-center lg:text-left">
            <Link to="/" className="inline-block mb-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-emerald-400 mb-4">
                GreenScape Lux
              </h1>
            </Link>
            <h2 className="text-3xl lg:text-4xl font-light text-white mb-6">
              Premium Landscape Services
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Transform your outdoor space with our expert landscaping professionals. 
              Quality service, beautiful results.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Navigation */}
            <div className="mb-6">
              <GlobalNavigation 
                showBack={showBackButton}
                customBackPath={backLink}
                className="justify-start"
              />
            </div>

            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold text-white mb-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-gray-400 text-lg">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-emerald-500/20 rounded-lg p-8">
              {children}
            </div>
            
            {/* Footer */}
            <div className="text-center mt-6 text-gray-400 text-sm">
              <p>
                By continuing, you agree to our{' '}
                <Link to="/terms" className="text-emerald-400 hover:text-emerald-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}