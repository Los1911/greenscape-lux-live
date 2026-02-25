import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { EnhancedEnvironmentValidator } from '@/components/setup/EnhancedEnvironmentValidator';

export default function EnvironmentStatus() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLastRefresh(new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Environment Status</h1>
            <p className="text-gray-600 mt-1">
              Real-time validation of environment variables and API configurations
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Validation
          </Button>
        </div>

        {/* Last Refresh Info */}
        <Alert>
          <AlertDescription>
            Last validated: {lastRefresh.toLocaleTimeString()} on {lastRefresh.toLocaleDateString()}
          </AlertDescription>
        </Alert>

        {/* Environment Validator Component */}
        <EnhancedEnvironmentValidator key={refreshKey} />

        {/* GitHub Secrets Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              GitHub Secrets Configuration
            </CardTitle>
            <CardDescription>
              How to update environment variables for GitHub Pages deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go to your repository settings on GitHub</li>
              <li>Navigate to <strong>Environments</strong> → <strong>github-pages</strong></li>
              <li>Update the following environment variables:</li>
            </ol>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm font-mono">
              <div><strong>VITE_SUPABASE_URL</strong> = https://your-project.supabase.co</div>
              <div><strong>VITE_SUPABASE_PUBLISHABLE_KEY</strong> = sb_publishable_...</div>
              <div><strong>VITE_STRIPE_PUBLISHABLE_KEY</strong> = pk_live_... or pk_test_...</div>
              <div><strong>VITE_GOOGLE_MAPS_API_KEY</strong> = AIza...</div>
            </div>

            <Alert>
              <AlertDescription>
                After updating secrets, trigger a new deployment by pushing a commit or manually running the GitHub Pages workflow.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
