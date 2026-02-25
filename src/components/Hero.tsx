import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { QuickSearchWidget } from '@/components/search/QuickSearchWidget';
const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative z-10 pb-4">
      {/* Logo with Pulsating Green Glow */}
      <div className="mb-8 relative">
        {/* Pulsating glow background */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-3xl animate-pulse scale-150"></div>
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl animate-pulse scale-125 animation-delay-500"></div>
        <div className="absolute inset-0 rounded-full bg-emerald-300/10 blur-xl animate-pulse scale-110 animation-delay-1000"></div>
        
        {/* Logo */}
        <img
          src="https://d64gsuwffb70l.cloudfront.net/68366206d4e44998c9b3046b_1753839626505_2eaea86f.png"
          alt="GreenScape Lux Logo"
          className="relative z-10 mx-auto w-32 h-32 md:w-40 md:h-40 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:drop-shadow-[0_0_30px_rgba(34,197,94,0.7)] transition-all duration-300"
        />
      </div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold text-emerald-400 mb-4">
        GreenScape Lux
      </h1>
      
      <h2 className="text-xl md:text-2xl text-white mb-4 font-semibold">
        Your Lawn. Our Luxury.
      </h2>
      
      <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
        Charlotte's elite landscaping service offering instant booking and luxury-level care all at your fingertips.
      </p>
      

      
      <div className="flex flex-col sm:flex-row gap-6">
        <Button 
          onClick={() => navigate('/get-started')}
          className="bg-emerald-500 hover:bg-emerald-600 text-black px-8 py-4 font-bold rounded-full shadow-md hover:shadow-emerald-500/50 transition-all duration-300 text-lg glow-emerald hover:glow-emerald-strong"
        >
          Get Started
        </Button>
        <Button 
          onClick={() => {
            console.log('🚀 Request Estimate button triggered from Hero Section');
            navigate('/get-quote');
          }}
          variant="outline"
          className="bg-transparent border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black px-8 py-4 font-bold rounded-full shadow-md hover:shadow-emerald-500/50 transition-all duration-300 text-lg"
        >
          Request Estimate
        </Button>


      </div>
    </section>
  );
};

export default Hero;