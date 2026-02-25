import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AnimatedBackground from '@/components/AnimatedBackground';
import Hero from '@/components/Hero';
import LuxuryServices from '@/components/LuxuryServices';
// import { PortfolioGallery } from '@/components/portfolio/PortfolioGallery';
import Footer from '@/components/Footer';
import { 
  detectAndSetRecoveryIntent, 
  clearRecoveryIntentIfNoParams 
} from '@/utils/passwordResetGuard';

const GreenScapeLuxLanding: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // PART 1 & 3: Recovery intent detection and cleanup
    // Detect recovery intent from URL parameters
    const hasRecoveryIntent = detectAndSetRecoveryIntent();
    
    // If NO recovery params, clear any stale recovery intent
    // This prevents persistent state issues in production
    if (!hasRecoveryIntent) {
      clearRecoveryIntentIfNoParams();
    }
    
    // Comprehensive password reset redirect handler
    // Supabase sends reset links to the Site URL (root), so we intercept and redirect to /reset-password
    
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check for password reset indicators in BOTH query and hash
    const recoveryTypeQuery = queryParams.get('type');
    const recoveryTypeHash = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const codeParam = queryParams.get('code'); // PKCE flow code parameter
    const errorQuery = queryParams.get('error');
    const errorHash = hashParams.get('error');
    const errorCode = queryParams.get('error_code') || hashParams.get('error_code');
    
    // Detect if this is a password reset flow (success or error)
    const isRecoveryFlow = 
      recoveryTypeQuery === 'recovery' || 
      recoveryTypeHash === 'recovery' ||
      accessToken ||
      codeParam || // PKCE flow
      errorCode === 'otp_expired' ||
      (errorQuery === 'access_denied' && errorCode);
    
    if (isRecoveryFlow) {
      console.log('[Landing] Password reset flow detected, redirecting to /reset-password');
      
      // Build the redirect URL preserving ALL parameters
      let redirectUrl = '/reset-password';
      
      // Preserve query params if present
      if (window.location.search) {
        redirectUrl += window.location.search;
      }
      
      // Preserve hash params if present
      if (window.location.hash) {
        redirectUrl += window.location.hash;
      }
      
      console.log('[Landing] Redirecting to:', redirectUrl);
      navigate(redirectUrl, { replace: true });
      return;
    }
  }, [navigate]);


  return (
    <div className="relative bg-black min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10">
        <section className="mb-4">
          <Hero />
        </section>
        <section className="mb-4">
          <LuxuryServices />
        </section>
        {/* <section className="mb-4">
          <PortfolioGallery />
        </section> */}
      </div>
      <Footer />
    </div>
  );
};

export default GreenScapeLuxLanding;

