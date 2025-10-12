import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Wrench, UserPlus, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function GetStarted() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />
      <Header />
      


      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          {/* Portal Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              Get Started
            </h1>
            <p className="text-gray-300 text-xl">Choose how you'd like to join GreenScape Lux</p>
          </div>

          {/* Cards Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Client Portal Card */}
            <Card className="group bg-black/60 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-[1.02] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl"></div>
              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/50 group-hover:animate-pulse">
                  <User className="w-10 h-10 text-black" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">
                    Client Portal
                  </h3>
                  <p className="text-lg text-gray-300 group-hover:text-emerald-200 transition-colors mb-6">
                    Request luxury landscaping services
                  </p>
                   
                   <div className="space-y-4">
                     <Button 
                        onClick={() => navigate('/client-login')}
                       className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] shadow-lg shadow-emerald-500/50 flex items-center justify-center"
                     >
                       <User className="w-5 h-5 mr-2" />
                       Access Portal
                     </Button>
                   </div>
                 </div>
               </div>
             </Card>

            {/* Professional Portal Card */}
            <Card className="group bg-black/60 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-[1.02] relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-2xl"></div>
              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/50 group-hover:animate-pulse">
                  <Briefcase className="w-10 h-10 text-black" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">
                    Professional Portal
                  </h3>
                  <p className="text-lg text-gray-300 group-hover:text-emerald-200 transition-colors mb-6">
                    Join our network of elite landscaping professionals
                  </p>
                  
                   <div className="space-y-4">
                     <Button 
                        onClick={() => navigate('/pro-login')}
                       className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] shadow-lg shadow-emerald-500/50 flex items-center justify-center"
                     >
                       <Briefcase className="w-5 h-5 mr-2" />
                       Access Portal
                     </Button>
                   </div>
                </div>
              </div>
            </Card>
          </div>
          {/* Bottom Section - Optional Help Text */}
          <div className="text-center mt-12">
            <p className="text-gray-500 text-sm">
              Need help choosing? Contact our support team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}