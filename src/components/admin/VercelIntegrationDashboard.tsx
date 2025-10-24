import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface VercelCredentials {
  user?: any;
  teams?: any[];
  projects?: any[];
  instructions?: any;
}

interface DeploymentStatus {
  id: string;
  state: string;
  url?: string;
  createdAt: string;
}

export function VercelIntegrationDashboard() {
  const [credentials, setCredentials] = useState<VercelCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const detectCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vercel-credentials-detector');
      if (error) throw error;
      setCredentials(data);
    } catch (error) {
      console.error('Failed to detect credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncEnvironmentVariables = async (environment: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-environment-variables', {
        body: {
          environment,
          variables: {
            STRIPE_SECRET_KEY: 'sk_test_...',
            VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_...'
          }
        }
      });
      if (error) throw error;
      setSyncStatus(data);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateStripeKeys = async () => {
    setLoading(true);
    try {
      const secretValidation = await supabase.functions.invoke('validate-stripe-key', {
        body: {
          key: 'sk_test_...',
          type: 'secret',
          blockDeployment: true
        }
      });

      const publishableValidation = await supabase.functions.invoke('validate-stripe-key', {
        body: {
          key: 'pk_test_...',
          type: 'publishable',
          blockDeployment: true
        }
      });

      console.log('Validation results:', { secretValidation, publishableValidation });
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectCredentials();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vercel Integration</h2>
          <p className="text-muted-foreground">
            Manage environment variables and deployments across all environments
          </p>
        </div>
        <Button onClick={detectCredentials} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="sync">Environment Sync</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="validation">Key Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vercel Credentials Status</CardTitle>
              <CardDescription>
                Configure your Vercel integration credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {credentials?.user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Connected as {credentials.user.name || credentials.user.email}</span>
                  </div>

                  {credentials.teams && credentials.teams.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Available Teams:</h4>
                      <div className="space-y-2">
                        {credentials.teams.map((team: any) => (
                          <div key={team.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{team.name}</span>
                            <Badge variant="outline">{team.id}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {credentials.projects && credentials.projects.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Available Projects:</h4>
                      <div className="space-y-2">
                        {credentials.projects.map((project: any) => (
                          <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                            <span>{project.name}</span>
                            <Badge variant="outline">{project.id}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Vercel credentials not configured. Please add VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID to your Supabase secrets.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Development</CardTitle>
                <CardDescription>Sync to development environment</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => syncEnvironmentVariables('development')}
                  disabled={loading}
                  className="w-full"
                >
                  Sync Development
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staging</CardTitle>
                <CardDescription>Sync to staging environment</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => syncEnvironmentVariables('preview')}
                  disabled={loading}
                  className="w-full"
                >
                  Sync Staging
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production</CardTitle>
                <CardDescription>Sync to production environment</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => syncEnvironmentVariables('production')}
                  disabled={loading}
                  className="w-full"
                  variant="destructive"
                >
                  Sync Production
                </Button>
              </CardContent>
            </Card>
          </div>

          {syncStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Last Sync Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {syncStatus.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>Environment: {syncStatus.environment}</span>
                  </div>
                  {syncStatus.syncedVariables && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Synced: {syncStatus.syncedVariables.join(', ')}
                      </span>
                    </div>
                  )}
                  {syncStatus.deployment && (
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Deployment: {syncStatus.deployment.id}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Key Validation</CardTitle>
              <CardDescription>
                Validate Stripe keys and block deployments if invalid
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={validateStripeKeys}
                disabled={loading}
              >
                Validate Keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}