import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, ArrowRight } from 'lucide-react';

export default function RoleSelectionLanding() {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-gradient-to-br from-emerald-900 via-gray-900 to-black flex flex-col relative overflow-hidden w-full"
      style={{
        minHeight: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Decorative background — absolute inset-0 z-0 pointer-events-none */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Main content — relative z-10, flexbox centered */}
      <div 
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-6"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="max-w-4xl w-full mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome to <span className="text-emerald-400">GreenScape Lux</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Choose how you'd like to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Client Card */}
            <Card className="bg-gray-800/50 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer group w-full"
                  onClick={() => navigate('/client-signup')}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-emerald-500/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl text-white mb-2">I'm a Homeowner</CardTitle>
                <p className="text-gray-400">Looking for landscaping services</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-gray-300">
                  <li>• Request professional estimates</li>
                  <li>• Browse verified landscapers</li>
                  <li>• Track project progress</li>
                  <li>• Secure payments</li>
                </ul>

                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold group-hover:scale-105 transition-transform">
                  Sign Up as Client <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Landscaper Card */}
            <Card className="bg-gray-800/50 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer group w-full"
                  onClick={() => navigate('/landscaper-signup')}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 bg-emerald-500/10 rounded-full w-16 h-16 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Briefcase className="w-8 h-8 text-emerald-400" />
                </div>
                <CardTitle className="text-2xl text-white mb-2">I'm a Professional</CardTitle>
                <p className="text-gray-400">Landscaper looking for clients</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-gray-300">
                  <li>• Find new clients</li>
                  <li>• Manage your business</li>
                  <li>• Get paid faster</li>
                  <li>• Build your reputation</li>
                </ul>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold group-hover:scale-105 transition-transform">
                  Sign Up as Pro <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-400 mb-4">Already have an account?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => navigate('/portal-login')}>
                Portal Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
