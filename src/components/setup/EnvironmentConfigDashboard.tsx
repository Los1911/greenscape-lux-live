import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

interface EnvStatus {
  name: string;
  key: string;
  configured: boolean;
  valid?: boolean;
  testing?: boolean;
  error?: string;
}

export function EnvironmentConfigDashboard() {
  const [envStatuses, setEnvStatuses] = useState<EnvStatus[]>([
    {
      name: 'Supabase URL',
      key: 'VITE_SUPABASE_URL',
      configured: !import.meta.env.VITE_SUPABASE_URL?.includes('your-project'),
    },
    {
      name: 'Supabase Anon Key',
      key: 'VITE_SUPABASE_ANON_KEY',
      configured: !import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('your-anon-key'),
    },
    {
      name: 'Stripe Publishable Key',
      key: 'VITE_STRIPE_PUBLISHABLE_KEY',
      configured: !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_placeholder'),
    },
  ]);

  const allConfigured = envStatuses.every(s => s.configured);

  const testConnections = async () => {
    const newStatuses = [...envStatuses];

    // Test Supabase
    const supabaseStatus = newStatuses.find(s => s.key === 'VITE_SUPABASE_URL');
    if (supabaseStatus) {
      supabaseStatus.testing = true;
      setEnvStatuses([...newStatuses]);

      try {
        const { error } = await supabase.from('profiles').select('count').limit(1);
        supabaseStatus.valid = !error;
        supabaseStatus.error = error?.message;
      } catch (e: any) {
        supabaseStatus.valid = false;
        supabaseStatus.error = e.message;
      }
      supabaseStatus.testing = false;
    }

    // Test Stripe (basic validation)
    const stripeStatus = newStatuses.find(s => s.key === 'VITE_STRIPE_PUBLISHABLE_KEY');
    if (stripeStatus) {
      stripeStatus.testing = true;
      setEnvStatuses([...newStatuses]);

      const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      stripeStatus.valid = key?.startsWith('pk_');
      stripeStatus.error = stripeStatus.valid ? undefined : 'Invalid Stripe key format';
      stripeStatus.testing = false;
    }

    setEnvStatuses([...newStatuses]);
  };

  if (allConfigured) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <CardTitle>Environment Configuration Required</CardTitle>
          </div>
          <CardDescription>
            Your application is using fallback values. Configure environment variables in Vercel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Grid */}
          <div className="grid gap-3">
            {envStatuses.map((env) => (
              <div key={env.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{env.name}</div>
                  <div className="text-sm text-muted-foreground">{env.key}</div>
                  {env.error && <div className="text-sm text-red-500 mt-1">{env.error}</div>}
                </div>
                {env.testing ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                ) : env.valid === true ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : env.valid === false ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : !env.configured ? (
                  <XCircle className="h-5 w-5 text-yellow-500" />
                ) : null}
              </div>
            ))}
          </div>

          <Button onClick={testConnections} className="w-full">
            Test Connections
          </Button>

          {/* Instructions */}
          <Alert>
            <AlertTitle>Configuration Steps</AlertTitle>
            <AlertDescription className="mt-2 space-y-2 text-sm">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to your Vercel project dashboard</li>
                <li>Navigate to Settings → Environment Variables</li>
                <li>Add these variables:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><code className="bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_URL</code></li>
                    <li><code className="bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code></li>
                    <li><code className="bg-muted px-1 py-0.5 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code></li>
                  </ul>
                </li>
                <li>Redeploy your application</li>
              </ol>
              <a 
                href="https://vercel.com/docs/projects/environment-variables" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-500 hover:underline mt-2"
              >
                View Vercel Documentation <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
