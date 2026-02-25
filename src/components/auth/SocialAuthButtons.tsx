/**
 * Social Authentication Buttons Component
 * Provides Google and Apple Sign-In buttons with proper OAuth flow handling
 * 
 * Variants:
 * - default: Full-width buttons with text labels
 * - compact: Small circular icon-only buttons
 * - lux: Premium icon-only buttons with emerald glow effects (GreenScape Lux theme)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { signInWithSocialProvider, SocialProvider, isSocialAuthAvailable } from '@/lib/socialAuth';

interface SocialAuthButtonsProps {
  roleIntent?: 'client' | 'landscaper';
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'lux';
}

// Google SVG Icon - Optimized for icon-only display
const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Apple SVG Icon - Optimized for icon-only display
const AppleIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

export default function SocialAuthButtons({
  roleIntent = 'client',
  onError,
  onLoading,
  disabled = false,
  className = '',
  variant = 'default',
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const availability = isSocialAuthAvailable();

  const handleSocialSignIn = async (provider: SocialProvider) => {
    if (disabled || loadingProvider) return;

    setLoadingProvider(provider);
    onLoading?.(true);

    try {
      const result = await signInWithSocialProvider(provider, { roleIntent });

      if (!result.success && result.error) {
        onError?.(result.error);
      }
      // If successful, the page will redirect to the OAuth provider
    } catch (error: any) {
      onError?.(error.message || 'An unexpected error occurred');
    } finally {
      setLoadingProvider(null);
      onLoading?.(false);
    }
  };

  const isLoading = loadingProvider !== null;
  const isDisabled = disabled || isLoading;

  // Lux variant: Premium icon-only buttons with emerald glow
  if (variant === 'lux') {
    return (
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        {availability.google && (
          <button
            type="button"
            onClick={() => handleSocialSignIn('google')}
            disabled={isDisabled}
            aria-label="Continue with Google"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="
              w-12 h-12 
              flex items-center justify-center
              rounded-full
              bg-slate-800/80 
              border border-slate-700/50
              shadow-lg shadow-black/20
              transition-all duration-200 ease-out
              hover:bg-slate-700/90
              hover:border-emerald-500/50
              hover:shadow-emerald-500/20
              hover:shadow-xl
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-emerald-500/50
              focus-visible:ring-offset-2
              focus-visible:ring-offset-slate-900
              active:bg-slate-800/80
              disabled:opacity-50
              disabled:cursor-not-allowed
              disabled:hover:bg-slate-800/80
              disabled:hover:border-slate-700/50
              disabled:hover:shadow-lg
              group
            "
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <GoogleIcon size={22} />
            )}
          </button>
        )}
        
        {availability.apple && (
          <button
            type="button"
            onClick={() => handleSocialSignIn('apple')}
            disabled={isDisabled}
            aria-label="Continue with Apple"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="
              w-12 h-12 
              flex items-center justify-center
              rounded-full
              bg-slate-800/80 
              border border-slate-700/50
              shadow-lg shadow-black/20
              text-white
              transition-all duration-200 ease-out
              hover:bg-slate-700/90
              hover:border-emerald-500/50
              hover:shadow-emerald-500/20
              hover:shadow-xl
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-emerald-500/50
              focus-visible:ring-offset-2
              focus-visible:ring-offset-slate-900
              active:bg-slate-800/80
              disabled:opacity-50
              disabled:cursor-not-allowed
              disabled:hover:bg-slate-800/80
              disabled:hover:border-slate-700/50
              disabled:hover:shadow-lg
              group
            "
          >
            {loadingProvider === 'apple' ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <AppleIcon size={22} className="text-white group-hover:text-emerald-50" />
            )}
          </button>
        )}
      </div>
    );
  }



  // Compact variant: Small circular icon-only buttons
  if (variant === 'compact') {
    return (
      <div className={`flex gap-3 justify-center ${className}`}>
        {availability.google && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialSignIn('google')}
            disabled={isDisabled}
            aria-label="Continue with Google"
            className="w-12 h-12 p-0 rounded-full bg-white hover:bg-gray-100 border-gray-300 transition-all duration-200 hover:scale-105"
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <GoogleIcon />
            )}
          </Button>
        )}
        
        {availability.apple && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialSignIn('apple')}
            disabled={isDisabled}
            aria-label="Continue with Apple"
            className="w-12 h-12 p-0 rounded-full bg-black hover:bg-gray-900 border-gray-700 text-white transition-all duration-200 hover:scale-105"
          >
            {loadingProvider === 'apple' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <AppleIcon />
            )}
          </Button>
        )}
      </div>
    );
  }

  // Default variant: Full-width buttons with text
  return (
    <div className={`space-y-3 ${className}`}>
      {availability.google && (
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn('google')}
          disabled={isDisabled}
          aria-label="Continue with Google"
          className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium transition-all duration-200 hover:shadow-md"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <span className="mr-3"><GoogleIcon /></span>
          )}
          Continue with Google
        </Button>
      )}
      
      {availability.apple && (
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSocialSignIn('apple')}
          disabled={isDisabled}
          aria-label="Continue with Apple"
          className="w-full h-12 bg-black hover:bg-gray-900 text-white border-gray-700 font-medium transition-all duration-200 hover:shadow-md"
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <span className="mr-3"><AppleIcon /></span>
          )}
          Continue with Apple
        </Button>
      )}
    </div>
  );
}

// Divider component for separating social auth from email/password
// Use position="above" when social auth is below email form
export function AuthDivider({ 
  className = '', 
  position = 'below' 
}: { 
  className?: string;
  position?: 'above' | 'below';
}) {
  const text = position === 'above' ? 'Or continue with' : 'or continue with email';
  
  return (
    <div className={`relative my-6 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-600/50" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-gray-900 text-gray-400">{text}</span>
      </div>
    </div>
  );
}

// Lux-styled divider with emerald accent
export function LuxAuthDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`relative my-6 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-emerald-500/20" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-gray-900 text-gray-500 tracking-wide uppercase text-xs font-medium">
          Or continue with
        </span>
      </div>
    </div>
  );
}
