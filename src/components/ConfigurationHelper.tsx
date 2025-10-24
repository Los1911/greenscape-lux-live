import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const ConfigurationHelper: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const currentUrl = window.location.origin;
      const expectedDomain = 'https://greenscapelux.com';
      
      const issues = [];
      const fixes = [];

      if (currentUrl !== expectedDomain) {
        issues.push(`Current domain: ${currentUrl}, Expected: ${expectedDomain}`);
        fixes.push('Update Site URL in Supabase Dashboard');
      }

      // Check URL parameters for token issues
      const urlParams = new URLSearchParams(window.location.search);
      const hasTokens = urlParams.has('access_token') || urlParams.has('refresh_token');
      
      setConfig({
        currentDomain: currentUrl,
        expectedDomain,
        hasTokens,
        issues,
        fixes,
        redirectUrls: [
          'https://greenscapelux.com/**',
          'https://greenscapelux.com/reset-password',
          'https://greenscapelux.com/auth/callback',
          'https://greenscapelux.com/login',
          'https://greenscapelux.com/signup'
        ]
      });
    } catch (error) {
      console.error('Config check failed:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  if (!config) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Supabase Configuration Helper
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold">Current Status</h3>
          <div className="flex items-center gap-2">
            {config.currentDomain === config.expectedDomain ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>Domain: {config.currentDomain}</span>
          </div>
        </div>

        {config.issues.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Issues Found:</strong>
              <ul className="mt-2 list-disc list-inside">
                {config.issues.map((issue: string, i: number) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold">Required Supabase Settings</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p><strong>Site URL:</strong> https://greenscapelux.com</p>
            <p><strong>Password Reset Template:</strong></p>
            <code className="block mt-1 p-2 bg-white rounded">
              https://greenscapelux.com/reset-password?type=recovery
            </code>
          </div>
        </div>

        <Button onClick={checkConfiguration} disabled={loading}>
          {loading ? 'Checking...' : 'Recheck Configuration'}
        </Button>
      </CardContent>
    </Card>
  );
};