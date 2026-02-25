import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { FamousApiKeySync } from '@/utils/famousApiKeySync';

export function AutoSyncManager() {
  const [syncStatus, setSyncStatus] = useState(FamousApiKeySync.getStatus());
  const [productionStatus, setProductionStatus] = useState(FamousApiKeySync.validateProductionConfig());

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(FamousApiKeySync.getStatus());
      setProductionStatus(FamousApiKeySync.validateProductionConfig());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    const success = await FamousApiKeySync.syncToProduction();
    setSyncStatus(FamousApiKeySync.getStatus());
    setProductionStatus(FamousApiKeySync.validateProductionConfig());
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (isValid: boolean) => {
    return isValid ? 
      <Badge className="bg-green-100 text-green-800">Ready</Badge> : 
      <Badge variant="destructive">Issues</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Production Environment Status</span>
            {getStatusBadge(productionStatus.isValid)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            {getStatusIcon(productionStatus.isValid)}
            <span className="text-sm">{productionStatus.message}</span>
          </div>
          
          {!productionStatus.isValid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Action Required</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                Your production deployment is missing environment variables. 
                The app is running with fallback values.
              </p>
              <div className="text-xs text-yellow-600 space-y-1">
                <p>• Go to Vercel Dashboard → Settings → Environment Variables</p>
                <p>• Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY</p>

                <p>• Set for Production, Preview, and Development</p>
                <p>• Redeploy your application</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
