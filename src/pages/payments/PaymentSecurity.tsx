import React from 'react';
import PaymentLayout from '@/components/layouts/PaymentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


export default function PaymentSecurity() {
  const { loading: authLoading } = useAuth();


  // Auth loading guard - prevents white screen on refresh
  if (authLoading) {
    return (
      <PaymentLayout activeTab="security">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        </div>
      </PaymentLayout>
    );
  }

  return (
    <PaymentLayout activeTab="security">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-green-400" />
            Security & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-white">Payment Security</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  PCI DSS Level 1 Compliant
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  256-bit SSL Encryption
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Tokenized Card Storage
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  3D Secure Authentication
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-white">Compliance</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  GDPR Compliant
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  SOC 2 Type II
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  CCPA Compliant
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Regular Security Audits
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
            <h4 className="font-medium text-blue-300 mb-2">Data Protection</h4>
            <p className="text-sm text-blue-200">
              We never store your complete payment information on our servers. All sensitive data is 
              securely processed and stored by Stripe, our PCI-compliant payment processor.
            </p>
          </div>
        </CardContent>
      </Card>
    </PaymentLayout>
  );
}
