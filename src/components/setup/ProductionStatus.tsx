import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Database, CreditCard, MapPin, Mail } from 'lucide-react';
import { EnvironmentValidator } from '@/utils/environmentValidator';

export function ProductionStatus() {
  const validation = EnvironmentValidator.validateAll();

  const getStatusIcon = (isValid: boolean, hasWarning?: boolean) => {
    if (isValid && !hasWarning) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (hasWarning) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = (isValid: boolean, hasWarning?: boolean) => {
    if (isValid && !hasWarning) return <Badge variant="default" className="bg-green-100 text-green-800">Valid</Badge>;
    if (hasWarning) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    return <Badge variant="destructive">Invalid</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Production Status</h1>
          <p className="text-gray-600">System configuration and API key validation status</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Supabase
              </CardTitle>
              {getStatusBadge(validation.supabase.isValid)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(validation.supabase.isValid)}
                <span className="text-sm">{validation.supabase.message}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Stripe
              </CardTitle>
              {getStatusBadge(validation.stripe.isValid)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(validation.stripe.isValid)}
                <span className="text-sm">{validation.stripe.message}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Google Maps
              </CardTitle>
              {getStatusBadge(validation.googleMaps.isValid)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(validation.googleMaps.isValid)}
                <span className="text-sm">{validation.googleMaps.message}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Resend
              </CardTitle>
              {getStatusBadge(validation.resend.isValid)}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(validation.resend.isValid)}
                <span className="text-sm">{validation.resend.message}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Overall System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Critical Services</span>
                <div className="flex items-center gap-2">
                  {validation.supabase.isValid ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <XCircle className="h-4 w-4 text-red-600" />
                  }
                  <span className="text-sm">
                    {validation.supabase.isValid ? 'Operational' : 'Issues Detected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Processing</span>
                <div className="flex items-center gap-2">
                  {validation.stripe.isValid ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <XCircle className="h-4 w-4 text-red-600" />
                  }
                  <span className="text-sm">
                    {validation.stripe.isValid ? 'Ready' : 'Configuration Required'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}