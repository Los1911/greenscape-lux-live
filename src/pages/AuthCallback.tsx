/**
 * OAuth Callback Handler Page
 * Processes OAuth redirects from Google/Apple Sign-In
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { handleOAuthCallback } from '@/lib/socialAuth';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Check for error in URL params (OAuth provider errors)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('[AuthCallback] OAuth error:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || 'Authentication failed. Please try again.');
          return;
        }

        // Process the OAuth callback
        const result = await handleOAuthCallback();

        if (!result.success) {
          setStatus('error');
          setErrorMessage(result.error || 'Authentication failed. Please try again.');
          return;
        }

        setStatus('success');
        
        // Wait for auth context to update with role
        // The redirect will happen once role is resolved
      } catch (err: any) {
        console.error('[AuthCallback] Unexpected error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    };

    processCallback();
  }, [searchParams]);

  // Handle redirect once role is resolved
  useEffect(() => {
    if (status === 'success' && role && !authLoading) {
      const redirectPath = role === 'admin' 
        ? '/admin-dashboard' 
        : role === 'landscaper' 
          ? '/landscaper-dashboard' 
          : '/client-dashboard';
      
      console.log('[AuthCallback] Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [status, role, authLoading, navigate]);

  // Handle error redirect
  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => {
        navigate('/portal-login', { 
          replace: true,
          state: { error: errorMessage }
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, errorMessage, navigate]);

  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center">
      <AnimatedBackground />
      
      <div className="relative z-10 text-center p-8">
        {status === 'processing' && (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-white">Completing sign in...</h2>
            <p className="text-gray-400">Please wait while we set up your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Sign in successful!</h2>
            <p className="text-gray-400">Redirecting to your dashboard...</p>
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto mt-4" />
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-semibold text-white">Sign in failed</h2>
            <p className="text-red-400">{errorMessage}</p>
            <p className="text-gray-400 text-sm">Redirecting to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}
