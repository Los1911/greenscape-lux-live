import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const EnvironmentDiagnostic: React.FC = () => {
  const { toast } = useToast();
  
  const envChecks = [
    {
      name: 'Supabase URL',
      key: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL,
      required: true,
      validate: (val: string) => val && val.includes('supabase.co')
    },
    {
      name: 'Supabase Anon Key',
      key: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
      required: true,
      validate: (val: string) => val && val.startsWith('eyJ')
    },
    {
      name: 'Stripe Publishable Key',
      key: 'VITE_STRIPE_PUBLISHABLE_KEY',
      value: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      required: true,
      validate: (val: string) => val && val.startsWith('pk_')
    },
    {
      name: 'Google Maps API Key',
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      required: false,
      validate: (val: string) => val && val.startsWith('AIza')
    },
    {
      name: 'Site URL',
      key: 'VITE_SITE_URL',
      value: import.meta.env.VITE_SITE_URL,
      required: true,
      validate: (val: string) => val && val.startsWith('http')
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Environment variable copied successfully",
    });
  };

  const getStatusIcon = (check: any) => {
    if (!check.value) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (check.validate(check.value)) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (check: any) => {
    if (!check.value) {
      return check.required ? 'Missing (Required)' : 'Missing (Optional)';
    }
    if (check.validate(check.value)) {
      return 'Configured';
    }
    return 'Invalid Format';
  };

  const criticalIssues = envChecks.filter(check => 
    check.required && (!check.value || !check.validate(check.value))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          {criticalIssues.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {criticalIssues.length} critical environment variable{criticalIssues.length > 1 ? 's are' : ' is'} missing or invalid.
                This will cause application features to fail.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {envChecks.map((check) => (
              <div key={check.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check)}
                  <div>
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-gray-500">
                      {check.key}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {getStatusText(check)}
                  </span>
                  
                  {check.value && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${check.key}=${check.value}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {criticalIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deployment Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              To fix these issues, add the missing environment variables to your deployment platform:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Required Environment Variables:</h4>
              <div className="space-y-2 font-mono text-sm">
                {criticalIssues.map(issue => (
                  <div key={issue.key} className="flex justify-between items-center">
                    <span>{issue.key}=</span>
                    <span className="text-red-600">MISSING</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <a 
                href="https://vercel.com/docs/concepts/projects/environment-variables" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                Vercel Environment Variables <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};