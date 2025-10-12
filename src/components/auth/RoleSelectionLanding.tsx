import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, ArrowRight } from 'lucide-react';

export default function RoleSelectionLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
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
          <Card className="bg-gray-800/50 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer group"
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
                <li>• Get instant quotes</li>
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
          <Card className="bg-gray-800/50 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 cursor-pointer group"
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
                    onClick={() => navigate('/client-login')}>
              Client Login
            </Button>
            <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => navigate('/landscaper-login')}>
              Professional Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}