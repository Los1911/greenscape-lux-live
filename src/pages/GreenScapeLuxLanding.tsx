import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AnimatedBackground from '@/components/AnimatedBackground';
import Hero from '@/components/Hero';
import LuxuryServices from '@/components/LuxuryServices';
// import { PortfolioGallery } from '@/components/portfolio/PortfolioGallery';
import Footer from '@/components/Footer';

const GreenScapeLuxLanding: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simple password recovery check only
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const recoveryType = hashParams.get('type');
    
    if (recoveryType === 'recovery') {
      navigate('/reset-password');
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